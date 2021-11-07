const _ = require('lodash')
const Connect = require('./contract')
const HashTagModel = require('../models/hashtagModel.js')
const instance = new Connect(
  process.env.PUBLIC_KEY,
  process.env.PRIVATE_KEY,
  process.env.CONTRACT_ADDRESS,
  process.env.RPC
)

async function checkForNfts(wallet) {
  try {
    const hashTagModel = new HashTagModel()
    let nftIds = await hashTagModel.getNfts(),
      walletArray = [],
      tokenIds = [],
      obj = {},
      dataArray = [],
      arr = [],
      len = nftIds.length
    walletArray = _.fill(Array(len), wallet)
    // for (i = 0; i < nftIds.length; i++) {
    //   walletArray.push(wallet)
    //   tokenIds.push(nftIds[i])
    // }
    let data = await instance.balanceOfBatch(walletArray, nftIds)
    for (let i = 0; i < nftIds.length; i++) {
      if (data[i] > 0) {
        let key = nftIds[i]
        obj = { [key]: Number(data[i]) }
        dataArray.push(obj)
      }
    }
    return dataArray
  } catch (e) {
    throw e
  }
}

function formatInputData(dataArray, wallet, userId) {
  try {
    let arr = []
    dataArray.map(i => {
      for (let k in i) {
        for (let j = 0; j < i[k]; j++) {
          arr.push({ nftId: k, wallet: wallet, userId: userId })
        }
      }
    })
    return arr
  } catch (e) {
    throw e
  }
}

async function mintNft(wallet, nftId, amount) {
  try {
    let data = await instance.mint(wallet, nftId, amount)
    return data
  } catch (e) {
    throw e
  }
}

module.exports = { checkForNfts, formatInputData, mintNft }
