'use strict'
const User = require('../models/userModel.js')
const HashTagModel = require('../models/hashtagModel.js')
const publicSchema = require('../schema/publicSchema.js')
const ArchiveModel = require('../models/archiveModel.js')
const { checkForNfts, formatInputData, mintNft } = require('../utils')

module.exports = async function (fastify, opts) {
  fastify.post('/login', { schema: publicSchema.loginSchema }, async function (
    request,
    reply
  ) {
    try {
      const wallet = request.body.wallet
      const userModel = new User(),
        hashTagModel = new HashTagModel(),
        dataArray = await checkForNfts(wallet)
      console.log('dataArray', dataArray)
      if (dataArray.length > 0) {
        const user = await userModel.getUserByWallet(wallet)
        if (user == null || user.wallet !== wallet) {
          userModel.wallet = wallet
          await userModel.save(async (err, doc) => {
            if (err) {
              request.log.error(err)
              reply.error(err)
            } else {
              let userId = userModel._id,
                inputArray = formatInputData(dataArray, wallet, userId)
              await hashTagModel.addUser(inputArray)

              const token = fastify.jwt.sign(
                {
                  userId: userId,
                  wallet: wallet
                },
                { expiresIn: process.env.JWT_TOKEN_EXPIRY }
              )

              reply.success({
                token
              })
            }
          })
        } else {
          const token = fastify.jwt.sign(
            { userId: user._id, wallet: user.wallet },
            { expiresIn: process.env.JWT_TOKEN_EXPIRY }
          )
          reply.success({ token })
        }
      } else {
        reply.error({
          message: 'You dont have any NFT token. Please purchase NFT to login'
        })
      }
      return reply
    } catch (err) {
      reply.error(err)
    }
    return reply
  }),
    fastify.post('/nft/add', async function (request, reply) {
      try {
        let data = request.body.data,
          result = await HashTagModel.insertMany(data)
        reply.success({
          message: 'NFT added',
          data: result
        })
      } catch (err) {
        console.log(err)
        reply.error(err)
      }
      return reply
    }),
    fastify.get('/hashtag/count', async function (request, reply) {
      try {
        let hashTagModel = new HashTagModel(),
          result = await hashTagModel.getTwitterOccurance()
        reply.success({
          message: 'Twitter Count',
          data: result
        })
      } catch (err) {
        console.log(err)
        reply.error(err)
      }
      return reply
    }),
    fastify.post('/nft/mint', async function (request, reply) {
      try {
        let { wallet, nftId, amount } = request.body,
          result = mintNft(wallet, nftId, amount)
        reply.success({
          message: 'NFT added',
          data: result
        })
      } catch (err) {
        console.log(err)
        reply.error(err)
      }
      return reply
    }),
    fastify.get(
      '/admin/archive/:page',
      { schema: publicSchema.getArchiveSchema },
      async function (request, reply) {
        try {
          let { page } = request.params,
            archiveModel = new ArchiveModel(),
            data = await archiveModel.getAllData(page)
          if (data.length > 0) {
            reply.success({ message: 'List', data: data })
          } else {
            reply.success({ message: 'Nothing to list', data: [] })
          }
        } catch (err) {
          console.log(err)
          reply.error(err)
        }
        return reply
      }
    ),
    fastify.get('/team/detail', async function (request, reply) {
      try {
        let hashTagModel = new HashTagModel(),
          result = await hashTagModel.getTeamDetail('1')
        reply.success({
          message: 'Twitter Count',
          data: result
        })
      } catch (err) {
        console.log(err)
        reply.error(err)
      }
      return reply
    })
}
