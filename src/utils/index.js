const _ = require('lodash')
const Connect = require('./contract')
const HashTagModel = require('../models/hashtagModel.js')
const StakeModel = require('../models/stakeModel.js')
const Soi = require('./soi.js')
const instance = new Connect(
  process.env.PUBLIC_KEY,
  process.env.PRIVATE_KEY,
  process.env.CONTRACT_ADDRESS,
  process.env.RPC
)
let stakeModel = new StakeModel(),
  totalStake = 0,
  holdingStakeWT = 0,
  stakeShareWT = 0,
  teamShareWT = 0,
  holdingStakeST = 0,
  stakeShareST = 0,
  teamShareST = 0,
  burnStake = 0

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
    console.log(data)
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

async function syncData(data, wallet, userId, balance) {
  try {
    const hashTagModel = new HashTagModel()
    let newUsers = data.users.filter(value => value != userId),
      newWallets = data.wallets.filter(
        value => value.toLowerCase() != wallet.toLowerCase()
      ),
      usersArray = _.fill(Array(balance[data.nftId]), userId)

    newUsers = _.concat(newUsers, usersArray)
    newWallets = _.concat(
      newWallets,
      _.fill(Array(balance[data.nftId]), wallet)
    )

    let update = await hashTagModel.updateTeam(data._id, {
      users: newUsers,
      wallets: newWallets
    })
    return update
  } catch (e) {
    throw e
  }
}

async function mintSoiToken(amount) {
  try {
    let weiAmount = Soi.contract.toWei(amount.toString())
    let result = await Soi.contract.mint(
      process.env.TWITTER_INFLUENCE_KEY,
      weiAmount
    )
    console.log('######', result)
    return result
  } catch (e) {
    console.log('ERRor here', e)
    throw e
  }
}

//function to distribute soi(equal to twit count for each team) for members
async function claimSoiToken(data) {
  try {
    let obj = {},
      walletArray = [],
      amountArray = []
    data.map(item => {
      let len = item.wallets.length
      if (len > 0) {
        let amount = item.twitter / len
        amount = Soi.contract.toWei(amount.toString())
        item.wallets.map(wallet => {
          obj[wallet] ? (obj[wallet] += amount) : (obj[wallet] = amount)
        })
      }
    })

    if (_.size(obj) > 0) {
      for (var property in obj) {
        if (!obj.hasOwnProperty(property)) {
          continue
        }

        walletArray.push(property)
        amountArray.push(obj[property])
      }
      await Soi.contract.addToClaimBatch(walletArray, amountArray)
    }
    return true
  } catch (e) {
    console.log(e)
    throw e
  }
}

//calculate totalstake and shares for stake holders and winning teams
async function stakeCalculator() {
  try {
    totalStake = await stakeModel.getTotalStake()
    holdingStakeWT = (60 / 100) * totalStake
    stakeShareWT = (30 / 100) * holdingStakeWT // stake for winning team stakeholders
    teamShareWT = (70 / 100) * holdingStakeWT // stake for winning team members

    holdingStakeST = (30 / 100) * totalStake // stake for second winning team
    stakeShareST = (30 / 100) * holdingStakeST //stake for second team stakeholders
    teamShareST = (70 / 100) * holdingStakeST //stake for second winning team members
    burnStake = (10 / 100) * totalStake
    return true
  } catch (e) {
    console.log(e)
    throw e
  }
}

//send soi againt stakes for winning team stake holders
async function stakeHolderSharesWT(hashTag) {
  try {
    let stakes = await stakeModel.getStakesByHashTag(hashTag),
      wallet = [],
      amount = [],
      tatalTeamStake = await stakeModel.getTotalStakeByHashTag(hashTag)
    stakes.map(item => {
      wallet.push(item.wallet)
      stakeAmount = (stakeShareWT / tatalTeamStake) * item.amount
      stakeAmount = Soi.contract.toWei(stakeAmount.toString())
      amount.push(stakeAmount)
    })

    console.log('stakeHolderSharesWT', wallet, amount)
    if (wallet.length === amount.length && wallet.length > 0)
      await sendSoiTokens(wallet, amount)

    return true
  } catch (e) {
    console.log(e)
    throw e
  }
}

//send soi againt stakes for second winning team stake holders

async function stakeHolderSharesST(hashTag) {
  try {
    let stakes = await stakeModel.getStakesByHashTag(hashTag),
      wallet = [],
      amount = [],
      tatalTeamStake = await stakeModel.getTotalStakeByHashTag(hashTag)
    stakes.map(item => {
      wallet.push(item.wallet)
      stakeAmount = (stakeShareST / tatalTeamStake) * item.amount
      stakeAmount = Soi.contract.toWei(stakeAmount.toString())
      amount.push(stakeAmount)
    })
    console.log('stakeHolderSharesST', wallet, amount)
    if (wallet.length === amount.length && wallet.length > 0)
      await sendSoiTokens(wallet, amount)

    return true
  } catch (e) {
    console.log(e)
    throw e
  }
}

//send stake shares for winning team members
async function stakesForWT(wallets) {
  try {
    let len = wallets.length,
      amount = teamShareWT / len
    amount = Soi.contract.toWei(amount.toString())
    amountArray = _.fill(Array(len), amount)
    console.log('stakesForWT', wallets, amountArray)
    if (wallets.length > 0) await sendSoiTokens(wallets, amountArray)

    return true
  } catch (e) {
    console.log(e)
    throw e
  }
}

//send stake shares for second winning team members
async function stakesForST(wallets) {
  try {
    let len = wallets.length,
      amount = teamShareST / len
    amount = Soi.contract.toWei(amount.toString())
    amountArray = _.fill(Array(len), amount)
    console.log('stakesForWT', wallets, amountArray)
    if (wallets.length > 0) await sendSoiTokens(wallets, amountArray)

    return true
  } catch (e) {
    console.log(e)
    throw e
  }
}

// claim soi tokens against stakes after anooouncement of winner
async function claimStakes(data) {
  try {
    let winnerTeam = data?.data[0]?.doc[0]
    secondWT = data?.data[0]?.doc[1]
    await stakeCalculator()
    // console.log(
    //   'totalStake: ',
    //   totalStake,
    //   'holdingStakeWT: ',
    //   holdingStakeWT,
    //   'stakeShareWT: ',
    //   stakeShareWT,
    //   'teamShareWT: ',
    //   teamShareWT,
    //   'holdingStakeST: ',
    //   holdingStakeST,
    //   'stakeShareST: ',
    //   stakeShareST,
    //   'teamShareST: ',
    //   teamShareST,
    //   'burnStake: ',
    //   burnStake
    // )
    await stakeHolderSharesWT(winnerTeam.hashTag)
    await stakeHolderSharesST(secondWT.hashTag)
    await stakesForWT(winnerTeam.wallets)
    await stakesForST(secondWT.wallets)
    let update = await stakeModel.updateProcessStatus()
    return update
  } catch (e) {
    console.log(e)
    throw e
  }
}

// send soi tokens

async function sendSoiTokens(wallet, amount) {
  try {
    await Soi.contract.addToClaimBatch(wallet, amount)
  } catch (e) {
    console.log(e)
    throw e
  }
}

module.exports = {
  checkForNfts,
  formatInputData,
  mintNft,
  syncData,
  mintSoiToken,
  claimSoiToken,
  claimStakes
}
