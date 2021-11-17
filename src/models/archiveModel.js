'use strict'
// External Dependancies
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const ArchiveSchema = new mongoose.Schema(
  {
    endDate: {
      type: Date,
      required: true
    },
    data: {
      type: Array,
      default: () => []
    },
    isMinted: {
      type: Boolean,
      default: false
    },
    isClaimed: {
      type: Boolean,
      default: false
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

ArchiveSchema.methods = {
  getAllData: async function (page) {
    const ArchiveModel = mongoose.model('Archive')
    let criteria = {}
    const options = {
      criteria: criteria,
      select: 'endDate data isMinted isClaimed isProcessed',
      page: page
    }
    return await ArchiveModel.list(options)
  },
  updateMintStatus: async function (docId) {
    const ArchiveModel = mongoose.model('Archive')
    return await ArchiveModel.findOneAndUpdate(
      { _id: docId },
      { isMinted: true },
      { new: true }
    )
  },
  getById: async function (docId) {
    const ArchiveModel = mongoose.model('Archive')
    return await ArchiveModel.findOne(
      { _id: docId, isMinted: true },
      { data: 1 }
    )
  },
  updateClaimStatus: async function (docId) {
    const ArchiveModel = mongoose.model('Archive')
    return await ArchiveModel.findOneAndUpdate(
      { _id: docId, isMinted: true, isClaimed: false },
      { isClaimed: true },
      { new: true }
    )
  },
  getWinners: async function () {
    const ArchiveModel = mongoose.model('Archive')
    let data = await ArchiveModel.find(
      {},
      {
        'data.twitterSum': 1,
        'data.doc.twitter': 1,
        'data.doc.hashTag': 1,
        'data.doc.wallets': 1
      }
    ).sort({
      createdAt: -1,
      _id: 1,
      'data.twitter': -1
    })
    return data
  },
  updateProcessStatus: async function (docId) {
    const ArchiveModel = mongoose.model('Archive')
    return await Stake.ArchiveModel(
      { _id: docId, isProcessed: false, isMinted: true, isClaimed: true },
      { $set: { isProcessed: true } },
      { new: true }
    )
  }
}
ArchiveSchema.statics = {
  list: function (options) {
    const criteria = options.criteria || {}
    const page = options.page === 0 ? 0 : options.page - 1
    const limit = parseInt(options.limit) || 20
    const select = options.select || 'endDate data isMinted'
    return this.find(criteria)
      .select(select)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .lean()
      .exec()
  }
}

ArchiveSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Archive', ArchiveSchema)
