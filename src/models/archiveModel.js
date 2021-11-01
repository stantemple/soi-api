'use strict'
// External Dependancies
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const ArchiveSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true
    },
    data: {
      type: Array,
      default: () => []
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
      select: 'date data ',
      page: page
    }
    return await ArchiveModel.list(options)
  }
}
ArchiveSchema.statics = {
  list: function (options) {
    const criteria = options.criteria || {}
    const page = options.page === 0 ? 0 : options.page - 1
    const limit = parseInt(options.limit) || 20
    const select = options.select || 'date data'
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
