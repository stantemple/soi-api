'use strict'
const omitEmpty = require('omit-empty')
const _ = require('lodash')
const User = require('../models/userModel.js')
const HashTagModel = require('../models/hashtagModel.js')
const userSchema = require('../schema/userSchema.js')
const { checkForNfts, formatInputData, syncData } = require('../utils')

module.exports = async function (fastify, opts) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.error(err)
    }
  }),
    fastify.post('/sync', async function (request, reply) {
      try {
        let hashTagModel = new HashTagModel(),
          newTokens = [],
          wallet = request.user.wallet,
          userId = request.user.userId,
          balance = await checkForNfts(wallet),
          data = await hashTagModel.checkPositions(wallet),
          diff = 0,
          newBalance = balance.map((value, key) => _.keys(value).toString())
        let res = await hashTagModel.getAllValues(newBalance)
        for (var i = 0; i < res.length; i++) {
          syncData(res[i], wallet, userId, balance[i])
        }

        reply.success({ message: 'Account synced' })
      } catch (e) {
        console.log(e)
        reply.error(e)
      }
      return reply
    }),
    fastify.put(
      '/profile',
      { schema: userSchema.profileSchema },
      async function (request, reply) {
        try {
          let userId = request.user.userId,
            userModel = new User(),
            update = {
              name: request.body.name,
              bio: request.body.bio,
              twitter_handle: request.body.twitter_handle
            }
          let cleanObj = omitEmpty(update),
            result = await userModel.updateProfile(userId, update)
          if (result) {
            reply.success({ message: 'updated', data: result })
          } else {
            reply.error({ message: 'Something went wrong' })
          }
        } catch (err) {
          console.log(err)
          reply.error(err)
        }
        return reply
      }
    ),
    fastify.get('/myteams', async function (request, reply) {
      try {
        let wallet = request.user.wallet,
          hashTagModel = new HashTagModel(),
          data = await hashTagModel.getTeams(wallet)
        if (data.length > 0) {
          reply.success({ message: 'My teams', data: data })
        } else {
          reply.success({ message: 'My teams', data: [] })
        }
      } catch (e) {
        console.log(err)
        reply.error(err)
      }
      return reply
    }),
    fastify.get('/profile', async function (request, reply) {
      try {
        let userId = request.user.userId,
          userModel = new User(),
          profile = await userModel.getUserById(userId)
        reply.success({ message: 'User profile', data: profile })
      } catch (err) {
        console.log(err)
        reply.error(err)
      }
      return reply
    })
}
