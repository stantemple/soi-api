const Web3 = require('Web3')
require('dotenv').config()
const SoiMaker = require('../../abi/SoiMaker.json')
const TokenSoi = require('../../abi/TokenSoi.json')
const getProvider = () => {
  let web3 = new Web3(process.env.RPC)
  const account = web3.eth.accounts.privateKeyToAccount(
    '0x' + process.env.PRIVATE_KEY
  )
  web3.eth.accounts.wallet.add(account)
  web3.eth.defaultAccount = account.address
  return web3
}

const contractInstance = (address, abi) => {
  const web3 = getProvider()
  return new web3.eth.Contract(abi, address)
}

const initContract = (address, abi) => [
  getProvider(),
  contractInstance(address, abi)
]

const methods = {
  mint: async (influence, amount) => {
    const [web3, contract] = initContract(process.env.SOI_MAKER, SoiMaker)

    try {
      const callMethod = contract.methods.createSoi(influence, amount)

      const gas = await callMethod.estimateGas({
        from: web3.eth.defaultAccount
      })

      return await callMethod.send({
        from: web3.eth.defaultAccount,
        gas
      })
    } catch (e) {
      throw e
    }
  },
  addToClaimBatch: async (accounts, amounts) => {
    const [web3, contract] = initContract(process.env.SOI_MAKER, SoiMaker)

    try {
      if (!Array.isArray(accounts)) {
        throw 'invalid accounts'
      }

      if (!Array.isArray(amounts)) {
        throw 'invalid amounts'
      }

      if (accounts.length !== amounts.length) {
        throw 'invalid arguments'
      }

      const callMethod = contract.methods.addToClaimBatch(accounts, amounts)

      const gas = await callMethod.estimateGas({
        from: web3.eth.defaultAccount
      })

      return await callMethod.send({
        from: web3.eth.defaultAccount,
        gas
      })
    } catch (e) {
      throw e
    }
  },
  balanceOf: address => {
    const [web3, contract] = initContract(process.env.TOKEN_SOI, erc721)
    const { isAddress } = web3.utils

    try {
      if (!isAddress(address)) {
        throw 'invalid address'
      }

      return contract.methods.balanceOf(address).call()
    } catch (e) {
      throw e
    }
  },
  toWei: amount => {
    const web3 = getProvider()
    try {
      return web3.utils.toWei(amount, 'ether')
    } catch (e) {
      throw e
    }
  }
}

exports.contract = { ...methods }
