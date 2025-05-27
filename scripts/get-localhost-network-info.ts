import { ethers } from 'hardhat'
import { time } from '@nomicfoundation/hardhat-network-helpers'

export async function getLocalhostNetworkInfo() {
  const network = await ethers.provider.getNetwork()
  const timestamp = await time.latest()
  const latestBlock = await time.latestBlock()
  const hardhatSigners = await ethers.getSigners()
  console.log('Network name:', network.name)
  console.log('Chain ID:', network.chainId)
  console.log('Latest block:', latestBlock)
  console.log(
    'Current timestamp:',
    timestamp,
    new Date(Number(timestamp) * 1000).toUTCString()
  )
  console.log('Hardhat signers:')
  console.log('Hardhat#19', hardhatSigners[19].address)
  const hardhat19balance = await ethers.provider.getBalance(
    hardhatSigners[19].address
  )
  console.log('Balance of Hardhat#19:', ethers.formatEther(hardhat19balance))
}

getLocalhostNetworkInfo().catch(err => {
  console.error(err)
  process.exit(1)
})
