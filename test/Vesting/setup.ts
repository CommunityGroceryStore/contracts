import { ethers } from 'hardhat'

import { getSigners } from '../util'
import { deployTokenContract } from '../Token/setup'

export async function deployVestingContract() {
  const SIGNERS = await getSigners()
  const {
    token,
    TOTAL_SUPPLY,
    TOTAL_SUPPLY_ATOMIC,
  } = await deployTokenContract()
  const tokenAddress = await token.getAddress()
  const Vesting = await ethers.getContractFactory('CGSVesting')
  const vesting = await Vesting.deploy(
    SIGNERS.owner,
    tokenAddress
  )

  return {
    vesting,
    token,
    tokenAddress,
    TOTAL_SUPPLY,
    TOTAL_SUPPLY_ATOMIC,
    ...SIGNERS
  }
}

