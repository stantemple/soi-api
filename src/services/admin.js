'use strict'
const User = require('../models/userModel.js')
const HashTagModel = require('../models/hashtagModel.js')
const publicSchema = require('../schema/publicSchema.js')
const ArchiveModel = require('../models/archiveModel.js')
const { mintSoiToken, claimSoiToken, claimStakes } = require('../utils')

module.exports = async function (fastify, opts) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.error(err)
    }
  }),
    fastify.post('/nft/add', async function (request, reply) {
      try {
        let data = request.body.data,
          role = request.user.role
        if (role && role === 'admin') {
          let result = await HashTagModel.insertMany(data)
          reply.success({
            message: 'NFT added',
            data: result
          })
        }
      } catch (err) {
        console.log(err)
        reply.error(err)
      }
      return reply
    }),
    fastify.post(
      '/admin/archive',
      { schema: publicSchema.archiveSchema },
      async function (request, reply) {
        try {
          let role = request.user.role
          if (role && role === 'admin') {
            let { endDate } = request.body,
              archiveModel = new ArchiveModel(),
              hashTagModel = new HashTagModel(),
              data = await hashTagModel.getTwitterOccurance(),
              twitterSum = data[0].twitterSum,
              claim = ''
            archiveModel.endDate = endDate
            archiveModel.data = data
            archiveModel.save(async (err, doc) => {
              if (err) {
                request.log.error(err)
                reply.error(err)
              } else {
                await hashTagModel.reset()
                await mintSoiToken(twitterSum)
                let update = await archiveModel.updateMintStatus(doc._id),
                  dataById = await archiveModel.getById(update._id),
                  result = await claimSoiToken(dataById.data[0].doc)
                if (result) {
                  claim = await archiveModel.updateClaimStatus(update._id)
                }
                reply.success({ message: 'soi tokens claimed', data: claim })
              }
            })
            //reply.success({ message: 'soi tokens claimed', data: claim })
          }
        } catch (err) {
          console.log('Catched error', err)
          reply.error(err)
        }
        return reply
      }
    )
  fastify.post(
    '/admin/stake',
    { schema: publicSchema.claimStakeSchema },
    async function (request, reply) {
      try {
        let role = request.user.role,
          { docId } = request.body
        if (role && role === 'admin') {
          let archiveModel = new ArchiveModel(),
            latestLeaderboard = await archiveModel.getWinners()
          let update = await claimStakes(latestLeaderboard[0])
          await archiveModel.updateProcessStatus(docId)

          // return latestLeaderboard[0]
          reply.success({ message: 'stakes claimed', data: update })
        }
      } catch (err) {
        console.log('Catched error', err)
        reply.error(err)
      }
      return reply
    }
  )
}
