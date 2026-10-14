const { StatusCodes } = require('http-status-codes')
const mongoose = require('mongoose')
const User = require('../models/auth')
const Account = require('../models/account')
const {
  BadRequestError,
  NotFoundError,
  UnAuthorizedError,
} = require('../errors/customError')

const userProjection = '-password -resetPasswordToken -resetPasswordExpire -__v'

const serializeUser = (user, account) => ({
  id: user._id,
  username: user.email,
  firstName: user.firstName,
  middleName: user.middleName || '',
  lastName: user.lastName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  country: user.country,
  role: user.role,
  createdAt: user.createdAt,
  account: account
    ? {
        id: account._id,
        accountNo: account.accountNo,
        balance: account.balance,
        checkingBal: account.checkingBal,
        cashBackBal: account.cashBackBal,
        status: account.status,
        transactionCount: account.transHistory?.length || 0,
      }
    : null,
})

const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean()
    const userIds = users.map((user) => user._id)
    const accounts = await Account.find({ createdBy: { $in: userIds } })
      .select(
        'accountNo balance checkingBal cashBackBal status transHistory createdBy',
      )
      .lean()

    const accountsByUser = new Map(
      accounts.map((account) => [String(account.createdBy), account]),
    )

    res.status(StatusCodes.OK).json({
      users: users.map((user) =>
        serializeUser(user, accountsByUser.get(String(user._id))),
      ),
    })
  } catch (error) {
    next(error)
  }
}

const adjustBalance = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { amount, operation, reason } = req.body
    const adjustment = Number(amount)

    if (!mongoose.isValidObjectId(userId)) {
      throw new BadRequestError('Invalid user id')
    }

    if (!Number.isFinite(adjustment) || adjustment <= 0) {
      throw new BadRequestError('Amount must be greater than zero')
    }

    if (!['add', 'subtract'].includes(operation)) {
      throw new BadRequestError('Operation must be add or subtract')
    }

    const user = await User.findById(userId).select(userProjection)
    if (!user) throw new NotFoundError('User not found')

    const increment = operation === 'add' ? adjustment : -adjustment
    const filter = {
      createdBy: userId,
      ...(operation === 'subtract' ? { balance: { $gte: adjustment } } : {}),
    }

    const account = await Account.findOneAndUpdate(
      filter,
      {
        $inc: { balance: increment },
        $push: {
          transHistory: {
            name: `Admin ${operation === 'add' ? 'credit' : 'debit'}`,
            category: reason,
            amount: adjustment,
            direction: operation === 'add' ? 'in' : 'out',
            status: 'completed',
            reference: `admin-${Date.now()}-${String(userId).slice(-6)}`,
            createdAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true },
    )

    if (!account) {
      throw new BadRequestError(
        operation === 'subtract'
          ? 'Insufficient user balance'
          : 'Account not found',
      )
    }

    res.status(StatusCodes.OK).json({
      msg: reason?.trim() || 'Balance updated',
      user: serializeUser(user.toObject(), account.toObject()),
    })
  } catch (error) {
    next(error)
  }
}

const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params

    if (!mongoose.isValidObjectId(userId)) {
      throw new BadRequestError('Invalid user id')
    }

    if (String(req.user.id) === String(userId)) {
      throw new UnAuthorizedError(
        'You cannot delete your own administrator account',
      )
    }

    const user = await User.findByIdAndDelete(userId)
    if (!user) throw new NotFoundError('User not found')

    await Account.deleteOne({ createdBy: userId })

    res.status(StatusCodes.OK).json({
      msg: 'User profile and account deleted successfully',
      userId,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { listUsers, adjustBalance, deleteUser }
