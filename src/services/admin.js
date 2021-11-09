'use strict'
const User = require('../models/userModel.js')
const HashTagModel = require('../models/hashtagModel.js')
const publicSchema = require('../schema/publicSchema.js')
const ArchiveModel = require('../models/archiveModel.js')
const { mintSoiToken, claimSoiToken } = require('../utils')

module.exports = async function (fastify, opts) {
  fastify.post(
    '/admin/archive',
    { schema: publicSchema.archiveSchema },
    async function (request, reply) {
      try {
        let { endDate } = request.body,
          archiveModel = new ArchiveModel(),
          hashTagModel = new HashTagModel(),
          data = await hashTagModel.getTwitterOccurance(),
          twitterSum = data[0].twitterSum
        archiveModel.endDate = endDate
        archiveModel.data = data
        archiveModel.save(async (err, doc) => {
          console.log(doc)
          if (err) {
            request.log.error(err)
            reply.error(err)
          } else {
            await hashTagModel.reset()
            await mintSoiToken(twitterSum)
            let update = await archiveModel.updateMintStatus(doc._id)
            reply.success({ message: 'Saved to archive', data: update })
          }
        })
      } catch (err) {
        console.log('Catched error', err)
        reply.error(err)
      }
      return reply
    }
  ),
    fastify.post('/admin/claim', async function (request, reply) {
      try {
        let archiveModel = new ArchiveModel(),
          data = await archiveModel.getById('618a8c1b9933e847130a5b4d')
        result = await claimSoiToken(data.data[0].doc)
        return true
      } catch (err) {
        console.log('Catched error', err)
        reply.error(err)
      }
    })
}
