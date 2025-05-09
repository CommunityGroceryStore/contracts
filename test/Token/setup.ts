import { ethers } from 'hardhat'

import { getSigners } from '../util'

export async function deployTokenContract() {
  const SIGNERS = await getSigners()
  const TOTAL_SUPPLY = 1_000_000_000
  const TOTAL_SUPPLY_ATOMIC = BigInt(TOTAL_SUPPLY) * BigInt(1e18)
  const Token = await ethers.getContractFactory('CGSToken')
  const token = await Token.deploy(SIGNERS.owner, TOTAL_SUPPLY_ATOMIC)

  return {
    token,
    TOTAL_SUPPLY,
    TOTAL_SUPPLY_ATOMIC,
    ...SIGNERS
  }
}
