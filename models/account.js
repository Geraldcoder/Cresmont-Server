const mongoose = require('mongoose')

const AccountSchema = new mongoose.Schema(
  {
    accountNo: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      match: [/^\d{10}$/, 'Account number must contain exactly 10 digits'],
    },

    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },

    checkingBal: {
      type: Number,
      default: 0,
      min: 0,
    },

    cashBackBal: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ['pending', 'active', 'restricted', 'suspended', 'closed'],
      default: 'pending',
    },

    transHistory: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },

        category: {
          type: String,
          required: true,
          trim: true,
        },

        amount: {
          type: Number,
          required: true,
          min: [0, 'Transaction amount cannot be negative'],
        },

        direction: {
          type: String,
          enum: ['in', 'out'],
          required: true,
        },

        status: {
          type: String,
          enum: ['pending', 'completed', 'declined'],
          default: 'pending',
          required: true,
        },

        reference: {
          type: String,
          trim: true,
          unique: true,
          sparse: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model('Account', AccountSchema)
