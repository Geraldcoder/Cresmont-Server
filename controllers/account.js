const { StatusCodes } = require('http-status-codes')
const Account = require('../models/account')
const User = require('../models/auth')
const {
  BadRequestError,
  UnAuthorizedError,
  NotFoundError,
} = require('../errors/customError')

const getUserDetails = async (req, res, next) => {
  try {
    const account = await Account.findOne({ createdBy: req.user.id }).select(
      '-__v',
    )
    if (!account) {
      throw new NotFoundError('Account not found')
    }
    res.status(StatusCodes.OK).json({ msg: account })
  } catch (error) {
    next(error)
  }
}

const transferFunds = async (req, res, next) => {
  try {
    const { amount, reference, name, status } = req.body
    const transferAmount = Number(amount)
    if (!transferAmount || transferAmount <= 0) {
      throw new BadRequestError('Input a valid amount')
    } else if (name.length < 10) {
      throw new BadRequestError('Input a valid recipient number')
    }
    const account = await Account.findOneAndUpdate(
      {
        createdBy: req.user.id,
        balance: { $gte: transferAmount },
        status: { $ne: 'closed' },
      },
      {
        $inc: {
          balance: -transferAmount,
        },
        $push: {
          transHistory: {
            name: `Transfer to ${name}`,
            category: 'Transfer Out',
            amount: transferAmount,
            direction: 'out',
            status: status || 'completed',
            reference: reference?.trim() || '',
            createdAt: new Date(),
          },
        },
      },
    )
    if (!account) {
      throw new BadRequestError('Insufficient funds')
    }
    res.status(StatusCodes.OK).json({ msg: account })
  } catch (error) {
    next(error)
  }
}

module.exports = { getUserDetails, transferFunds }
