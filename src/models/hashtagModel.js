'use strict'
// External Dependancies
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const Schema = mongoose.Schema
const ObjectId = require('mongodb').ObjectID

const HashtagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true
    },
    nftId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    hashTag: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    twitter: { type: Number, default: 0 },
    users: [{ type: Schema.ObjectId, ref: 'User' }],
    wallets: {
      type: Array,
      default: () => []
    },
    image: {
      type: String,
      index: true
    }
  },
  {
    timestamps: true,
    default: ''
  }
)

HashtagSchema.methods = {
  getUserById: async function (id) {
    const User = mongoose.model('Hashtag')
    let query = { _id: id }
    const options = {
      criteria: query
    }
    return User.load(options)
  },
  updateTwitterOccurnace: async function (obj) {
    const HashT = mongoose.model('Hashtag')
    let q = []
    for (let k in obj) {
      let temp = {
        updateOne: {
          filter: { hashTag: k },
          update: { $inc: { twitter: obj[k] } },
          upsert: true
        }
      }
      q.push(temp)
    }

    return await HashT.collection.bulkWrite(q)
  },
  checkPositions: async function (wallet) {
    const HashT = mongoose.model('Hashtag')
    let result = []

    let data = await HashT.aggregate([
      { $project: { wallets: 1, nftId: 1, users: 1 } },
      { $unwind: '$wallets' },
      { $match: { wallets: { $in: [wallet] } } },
      {
        $group: {
          _id: { wallet: '$wallets', nftId: '$nftId', userId: '$users' },
          count: { $sum: 1 }
        }
      }
    ])
    data.map(items => {
      result.push({ [items._id.nftId]: items.count })
    })
    return result
  },
  addUser: async function (data) {
    const HashT = mongoose.model('Hashtag')
    let q = []
    data.map(items => {
      let temp = {
        updateOne: {
          filter: { nftId: items.nftId },
          update: {
            $push: {
              wallets: items.wallet,
              users: items.userId
            }
          },
          upsert: true
        }
      }
      q.push(temp)
    })
    return await HashT.collection.bulkWrite(q)
  },
  getNfts: async function () {
    const HashT = mongoose.model('Hashtag')
    let result = await HashT.find(
        { nftId: { $ne: '' } },
        { nftId: 1, _id: -1 }
      ),
      nfts = []
    result.map(item => {
      if (item.nftId) nfts.push(Number(item.nftId))
    })
    return nfts
  },
  getTwitterOccurance: async function () {
    const HashT = mongoose.model('Hashtag')
    let data = await HashT.aggregate([
      {
        $match: { $and: [{ nftId: { $ne: null } }, { wallets: { $ne: [] } }] }
      },
      { $sort: { twitter: -1 } },

      {
        $group: {
          _id: null,
          twitterSum: { $sum: '$twitter' },
          doc: { $push: '$$ROOT' }
        }
      },

      {
        $project: {
          _id: 0,
          'doc.nftId': 1,
          'doc.hashTag': 1,
          'doc.twitter': 1,
          'doc.name': 1,
          'doc.image': 1,
          'doc.wallets': 1,
          'doc._id': -1,
          twitterSum: 1
        }
      }
    ])

    return data
  },
  getTeams: async function (wallet) {
    const HashT = mongoose.model('Hashtag')
    let result = []
    let data = await HashT.aggregate([
      {
        $project: {
          wallets: 1,
          nftId: 1,
          users: 1,
          hashTag: 1,
          image: 1,
          name: 1
        }
      },
      { $unwind: '$wallets' },
      { $match: { wallets: { $in: [wallet] } } },
      {
        $group: {
          _id: {
            nftId: '$nftId',
            userId: '$users',
            hashTag: '$hashTag',
            image: '$image',
            name: '$name'
          },
          count: { $sum: 1 }
        }
      }
    ])

    return data
  },
  reset: async function () {
    const HashT = mongoose.model('Hashtag')
    let result = await HashT.update(
      {},
      { $set: { twitter: 0 } },
      { multi: true }
    )
    return result
  },
  getHashTags: async function () {
    const HashT = mongoose.model('Hashtag')
    let result = await HashT.find({}, { hashTag: 1, _id: -1 }),
      tags = []
    result.map(item => {
      tags.push(item.hashTag)
    })
    return tags
  },
  getAllValues: async function (nftIds) {
    console.log(nftIds)
    const HashT = mongoose.model('Hashtag')
    let result = await HashT.find(
      { nftId: { $in: nftIds } },
      { users: 1, wallets: 1, nftId: 1 }
    )
    return result
  },
  updateTeam: async function (docId, data) {
    let { users, wallets } = data
    const HashT = mongoose.model('Hashtag')
    let result = await HashT.findOneAndUpdate(
      { _id: ObjectId(docId) },
      { users, wallets },
      { new: true }
    )
    return result
  },
  getTeamDetail: async function (nftId) {
    const HashT = mongoose.model('Hashtag')
    let data = await HashT.aggregate(
      [
        { $match: { nftId: nftId } },
        { $unwind: '$wallets' },
        // count
        {
          $group: {
            _id: {
              id: '$nftId',
              name: '$name',
              image: '$image',
              hashTag: '$hashTag',
              wallet: '$wallets'
            },
            nftTokens: { $sum: 1 }
          }
        },
        // build array
        {
          $group: {
            _id: {
              nftId: '$_id.id',
              name: '$_id.name',
              image: '$_id.image',
              hashTag: '$_id.hashTag'
            },
            users: {
              $push: {
                wallet: '$_id.wallet',
                nftTokens: '$nftTokens'
              }
            }
          }
        }
        // write to new collection
        //{ $out: 'occurences' }
      ]
      //{ allowDiskUse: true }
    )
    return data
  }
}

HashtagSchema.statics = {
  load: function (options, cb) {
    options.select = options.select || 'hashTag occurnace'
    return this.findOne(options.criteria).select(options.select).exec(cb)
  },

  list: function (options) {
    const criteria = options.criteria || {}
    const page = options.page - 1
    const limit = parseInt(options.limit) || 12
    const select = options.select || 'hashTag occurnace createdAt -__v'
    return this.find(criteria)
      .select(select)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .lean()
      .exec()
  }
}

HashtagSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Hashtag', HashtagSchema)
