const { StatusCodes } = require('http-status-codes')
const crypto = require('crypto')
const multer = require('multer')
const cloudinary = require('cloudinary').v2

const User = require('../models/auth')
const Account = require('../models/account')
const {
  BadRequestError,
  UnAuthorizedError,
  NotFoundError,
} = require('../errors/customError')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const generateAccountNumber = async () => {
  let accountNo
  let exists = true

  while (exists) {
    accountNo = String(Math.floor(1000000000 + Math.random() * 9000000000))

    exists = await Account.exists({ accountNo })
  }

  return accountNo
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true)
    }

    return cb(
      new BadRequestError('Only JPEG, PNG, and WebP images are allowed'),
    )
  },
})

const uploadProfileImage = (fileBuffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'cresmont-bank/profile-images',
        resource_type: 'image',
        transformation: [{ width: 800, height: 800, crop: 'limit' }],
      },
      (error, result) => {
        if (error) return reject(error)
        if (!result?.secure_url) {
          return reject(
            new Error('The image provider did not return an image URL'),
          )
        }
        resolve(result.secure_url)
      },
    )

    stream.end(fileBuffer)
  })

const register = async (req, res, next) => {
  try {
    const { email, password, confirmPassword, ...otherUserData } = req.body

    if (password !== confirmPassword) {
      throw new BadRequestError('Passwords do not match')
    }

    const alreadyExists = await User.findOne({ email })

    if (alreadyExists) {
      throw new BadRequestError('Email already exists')
    }

    const user = await User.create({
      ...otherUserData,
      email,
      password,
    })

    const accountNo = await generateAccountNumber()

    const account = await Account.create({
      accountNo,
      createdBy: user._id,
      balance: 500,
      checkingBal: 0,
      cashBackBal: 0,
      status: 'pending',
    })

    user.notifications.push({
      type: 'general',
      title: 'Welcome to Cresmont Bank!',
      detail: `Your account has been created successfully. Your account number is ${account.accountNo}.`,
    })

    await user.save()

    const token = user.getJWT()
    user.genCookie(res, token)

    res.status(StatusCodes.CREATED).json({ msg: user._id, token })
  } catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      throw new BadRequestError('Email not found')
    }
    const isPasswordCorrect = await user.comparePass(password)
    if (!isPasswordCorrect) {
      throw new UnAuthorizedError('Incorrect password')
    }
    const token = await user.getJWT()
    user.genCookie(res, token)
    res.status(StatusCodes.OK).json({ msg: user._id, token })
  } catch (error) {
    next(error)
  }
}

const updateProfile = async (req, res, next) => {
  try {
    // getUser() already uses req.user.id, so use the same auth payload property here.
    const userId = req.user?.id || req.user?.userId

    if (!userId) {
      throw new UnAuthorizedError('Please sign in to update your profile')
    }

    const allowedFields = [
      'nationality',
      'gender',
      'occupation',
      'idType',
      'idNumber',
      'state',
      'postalCode',
      'emergencyName',
      'emergencyPhone',
    ]

    const updates = {}

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] =
          typeof req.body[field] === 'string'
            ? req.body[field].trim()
            : req.body[field]
      }
    }

    // Only upload a new image when the user selected one. Keep the existing
    // profileImg URL when no replacement file is submitted.
    if (req.file) {
      updates.profileImg = await uploadProfileImage(req.file.buffer)
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestError('No profile details were provided to update')
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    ).select('-password -resetPasswordToken -resetPasswordExpire')

    if (!user) {
      throw new NotFoundError('User not found')
    }

    return res.status(StatusCodes.OK).json({
      msg: 'Profile updated successfully',
      user,
    })
  } catch (error) {
    return next(error)
  }
}

const logout = async (req, res, next) => {
  try {
    if (req.user) {
      const userId = req.user.id || req.user.userId
      const user = userId ? await User.findById(userId) : null

      if (user) {
        user.clearAuthCookie(res)
      }
    } else {
      // Clear the auth cookie even if the JWT is expired or invalid.
      const cookieName =
        process.env.NODE_ENV === 'production'
          ? '__Host-cresmont_access'
          : 'cresmont_access'

      res.clearCookie(cookieName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }

    return res.status(StatusCodes.NO_CONTENT).send()
  } catch (error) {
    return next(error)
  }
}

const passResetLink = async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email) {
      throw new BadRequestError('Please provide an email')
    }

    const user = await User.findOne({ email })

    if (!user) {
      throw new BadRequestError('Email not found')
    }

    const resetToken = crypto.randomBytes(32).toString('hex')

    user.resetPasswordToken = resetToken
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000)

    await user.save()

    const resetLink = `https://cresmont.netlify.app/reset-password/${resetToken}`

    // Replace this with your email service later
    console.log('Password reset link:', resetLink)

    res
      .status(StatusCodes.OK)
      .json({ msg: 'Password reset link generated', resetLink })
  } catch (error) {
    next(error)
  }
}

const resetPass = async (req, res, next) => {
  try {
    const { token } = req.params
    const { password, confirmPassword } = req.body

    if (!password || !confirmPassword) {
      throw new BadRequestError('Please provide both password fields')
    }

    if (password !== confirmPassword) {
      throw new BadRequestError('Passwords do not match')
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: {
        $gt: new Date(),
      },
    })

    if (!user) {
      throw new BadRequestError('Reset link is invalid or has expired')
    }

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save()

    res.status(StatusCodes.OK).json({ msg: 'Password reset successful' })
  } catch (error) {
    next(error)
  }
}

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) {
      throw new NotFoundError('User not found')
    }
    res.status(StatusCodes.OK).json({ msg: user })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  register,
  login,
  updateProfile,
  getUser,
  resetPass,
  passResetLink,
  logout,
  upload,
}
