import { ethers } from 'hardhat'

import { deployMockStablecoinContract, getSigners } from '../util'
import { deployVestingContract } from '../Vesting/setup'

export async function deployPresaleContract() {
  const deploy = await deployPresaleContractWithoutVestingAddress()
  const presaleAddress = await deploy.presale.getAddress()
  const vestingAddress = await deploy.vesting.getAddress()

  await deploy.presale.connect(deploy.owner).setVestingContractAddress(vestingAddress)
  await deploy.vesting.connect(deploy.owner).grantRole(
    ethers.id('VESTING_ADMIN_ROLE'),
    presaleAddress
  )
  await deploy.token
    .connect(deploy.owner)
    .transfer(presaleAddress, ethers.parseUnits('1000000', 18))

  return deploy
}

export async function deployPresaleContractWithoutVestingAddress() {
  const SIGNERS = await getSigners()
  const {
    mockStablecoin: usdt
  } = await deployMockStablecoinContract('USDT', 'USDT', 1_000_000)()
  const {
    mockStablecoin: usdc
  } = await deployMockStablecoinContract('USDC', 'USDC', 1_000_000)()
  const INITIAL_VESTING_DURATION = 60 * 60 // an hour
  const INITIAL_VESTING_CLIFF = 60 * 15 // 15 minutes
  const {
    token,
    tokenAddress,
    TOTAL_SUPPLY,
    TOTAL_SUPPLY_ATOMIC,
    vesting
  } = await deployVestingContract()

  const Presale = await ethers.getContractFactory('CGSTokenPresale')
  const presale = await Presale.deploy(
    SIGNERS.owner,
    tokenAddress,
    INITIAL_VESTING_DURATION,
    INITIAL_VESTING_CLIFF
  )

  return {
    usdt,
    usdc,
    presale,
    token,
    TOTAL_SUPPLY,
    TOTAL_SUPPLY_ATOMIC,
    vesting,
    INITIAL_VESTING_DURATION,
    INITIAL_VESTING_CLIFF,
    ...SIGNERS
  }
}
