const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please provide a first name'],
      trim: true,
    },

    middleName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      required: [true, 'Please provide a last name'],
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Please provide an email...'],
      match: [
        /(?:[a-z0-9!#$%&'*+\x2f=?^_`\x7b-\x7d~\x2d]+(?:\.[a-z0-9!#$%&'*+\x2f=?^_`\x7b-\x7d~\x2d]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9\x2d]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
        'Please provide a valid email',
      ],
      unique: true,
    },

    dob: {
      type: Date,
      required: [true, 'Please provide a date of birth'],
    },

    country: {
      type: String,
      required: [true, 'Please provide a country'],
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },

    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpire: {
      type: Date,
    },

    notifications: [
      {
        type: {
          type: String,
          enum: ['funds', 'card_disabled', 'account_restricted', 'general'],
        },

        title: {
          type: String,
          required: true,
          trim: true,
        },

        detail: {
          type: String,
          required: true,
          trim: true,
        },

        read: {
          type: Boolean,
          default: false,
        },

        time: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    gender: {
      type: String,
      enum: ['male', 'female', 'prefer not to say'],
    },

    occupation: {
      type: String,
      trim: true,
    },

    profileImg: {
      type: String,
      trim: true,
    },

    idType: {
      type: String,
      enum: [
        'State-issued ID card',
        'Passport',
        'Driver’s licence',
        'Voter Registration Card',
      ],
    },

    idNumber: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    postalCode: {
      type: String,
      trim: true,
    },

    emergencyName: {
      type: String,
      trim: true,
    },

    emergencyPhone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

UserSchema.methods.getJWT = function () {
  return jwt.sign(
    {
      id: this._id,
      name: `${this.firstName} ${this?.middleName} ${this.lastName}`,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '2h',
    },
  )
}

UserSchema.methods.comparePass = function (password) {
  return this.password === password
}

UserSchema.methods.genCookie = function (res, token) {
  const cookieName =
    process.env.NODE_ENV === 'production'
      ? '__Host-cresmont_access'
      : 'cresmont_access'

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000,
  })
}

UserSchema.methods.clearAuthCookie = function (res) {
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

module.exports = mongoose.model('User', UserSchema)
