'use strict'
// External Dependancies
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const CursorSchema = new mongoose.Schema(
  {
    since_id: {
      type: String,
      required: true,
      unique: true,
      index: true
    }
  },
  {
    timestamps: true
  }
)

CursorSchema.methods = {
  getCursor: async function () {
    try {
      const CursorModel = mongoose.model('Cursor')
      let data = await CursorModel.findOne({}, { since_id: 1 })
      return data
    } catch (e) {
      console.log(e)
    }
  },
  updateCursor: async function (temp_since_id, since_id) {
    try {
      const CursorModel = mongoose.model('Cursor')
      let data = await CursorModel.findOneAndUpdate(
        { since_id: temp_since_id },
        { $set: { since_id: since_id } },
        { upsert: true, new: true }
      )
      return data
    } catch (e) {
      console.log(e)
    }
  }
}

CursorSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Cursor', CursorSchema)
