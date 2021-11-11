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
      select: 'endDate data isMinted ',
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
