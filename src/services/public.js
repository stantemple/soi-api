'use strict'
const User = require('../models/userModel.js')
const HashTagModel = require('../models/hashtagModel.js')
const publicSchema = require('../schema/publicSchema.js')
const ArchiveModel = require('../models/archiveModel.js')
const StakeModel = require('../models/stakeModel.js')
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
    fastify.get(
      '/team/:nftId',
      { schema: publicSchema.getTeamSchema },
      async function (request, reply) {
        let { nftId } = request.params
        try {
          let hashTagModel = new HashTagModel(),
            result = await hashTagModel.getTeamDetail(nftId)
          reply.success({
            message: 'Twitter Count',
            data: result
          })
        } catch (err) {
          console.log(err)
          reply.error(err)
        }
        return reply
      }
    ),
    fastify.post(
      '/stake',
      { schema: publicSchema.stakeSchema },
      async function (request, reply) {
        try {
          let { wallet, hashTag, amount } = request.body,
            stakeModel = new StakeModel()
          stakeModel.wallet = wallet
          stakeModel.hashTag = hashTag
          stakeModel.amount = amount

          stakeModel.save((err, doc) => {
            if (err) {
              throw err
            } else {
              reply.success({
                message: 'Staked',
                data: doc
              })
            }
          })
        } catch (err) {
          console.log(err)
          reply.error(err)
        }
        return reply
      }
    ),
    fastify.post(
      '/mystake',
      { schema: publicSchema.getStakeSchema },
      async function (request, reply) {
        let { hashTag, wallet } = request.body
        try {
          let stakeModel = new StakeModel(),
            result = await stakeModel.getTotalStakeByWallet(hashTag, wallet)
          reply.success({
            message: 'Total Stake',
            data: result
          })
        } catch (err) {
          console.log(err)
          reply.error(err)
        }
        return reply
      }
    )
}
