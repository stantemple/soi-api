'use strict'
// External Dependancies
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const ObjectId = require('mongodb').ObjectID
const bcrypt = require('bcrypt')
const Schema = mongoose.Schema
const SALT_ROUNDS = 10

const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    hashed_password: {
      type: String,
      default: ''
    },
    authToken: {
      type: String,
      default: ''
    },
    salt: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
)

AdminSchema.virtual('password')
  .set(function (password) {
    this._password = password
    this.salt = this.makeSalt()
    this.hashed_password = this.encryptPassword(password)
  })
  .get(function () {
    return this._password
  })

AdminSchema.methods = {
  makeSalt: function () {
    return bcrypt.genSaltSync(SALT_ROUNDS)
  },

  encryptPassword: function (password) {
    if (!password) return ''
    return bcrypt.hashSync(password, this.salt)
  },
  authenticate: function (plainText) {
    return bcrypt.compareSync(plainText, this.hashed_password)
  },

  getUserByEmail: async function (email) {
    const Admin = mongoose.model('Admin')
    let query = { email: email }
    const options = {
      criteria: query,
      select: 'email hashed_password '
    }
    return Admin.load(options)
  }
}

AdminSchema.statics = {
  load: function (options, cb) {
    options.select = options.select || 'email '
    return this.findOne(options.criteria).select(options.select).exec(cb)
  }
}

AdminSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Admin', AdminSchema)
