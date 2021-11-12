'use strict'
// External Dependancies
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const StakeSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true
    },
    hashTag: {
      type: String,
      required: true
    },
    amount: {
      type: String,
      required: true
    },
    isProcessed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

StakeSchema.methods = {
  getTotalStake: async function () {
    const Stake = mongoose.model('Stake')
    let data = await Stake.aggregate([
      { $match: { isProcessed: false } },
      {
        $group: {
          _id: null,
          totalStake: { $sum: 'amount' }
        }
      },

      {
        $project: {
          _id: 0,
          totalStake: 1
        }
      }
    ])

    return data
  },
  getStakesByHashTag: async function (hashTag) {
    const Stake = mongoose.model('Stake')
    return await Stake.find(
      { hashTag: hashTag, isProcessed: false },
      { wallet: 1, amount: 1, _id: -1 }
    )
  }
}

StakeSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Stake', StakeSchema)
