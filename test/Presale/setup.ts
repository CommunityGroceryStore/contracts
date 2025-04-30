import { ethers } from 'hardhat'

import { deployMockStablecoinContract, getSigners } from '../util'
import { deployTokenContract } from '../Token/setup'

export async function deployPresaleContract() {
  const SIGNERS = await getSigners()

  const {
    mockStablecoin: usdt
  } = await deployMockStablecoinContract('USDT', 'USDT', 1_000_000)()

  const {
    mockStablecoin: usdc
  } = await deployMockStablecoinContract('USDC', 'USDC', 1_000_000)()

  const {
    token,
    TOTAL_SUPPLY,
    TOTAL_SUPPLY_ATOMIC,
  } = await deployTokenContract()
  const tokenAddress = await token.getAddress()
  const Presale = await ethers.getContractFactory('CGSTokenPresale')
  const presale = await Presale.deploy(SIGNERS.owner, tokenAddress)

  return {
    usdt,
    usdc,
    presale,
    token,
    TOTAL_SUPPLY,
    TOTAL_SUPPLY_ATOMIC,
    ...SIGNERS
  }
}
