import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'

import { deployVestingContract } from './setup'

describe('Vesting - Deployment', function () {
  it('Grants DEFAULT_ADMIN_ROLE to owner', async function () {
    const {
      vesting,
      owner
    } = await loadFixture(deployVestingContract)

    const defaultAdmins = await vesting.getRoleMembers(
      await vesting.DEFAULT_ADMIN_ROLE()
    )

    expect(defaultAdmins).to.deep.equal([ owner.address ])
  })

  it('Grants VESTING_ADMIN_ROLE to owner & deployer', async function () {
    const {
      vesting,
      owner,
      deployer
    } = await loadFixture(deployVestingContract)

    const vestingAdmins = await vesting.getRoleMembers(
      await vesting.VESTING_ADMIN_ROLE()
    )

    expect(vestingAdmins).to.deep.equal([ owner.address, deployer.address ])
  })

  it('Grants VESTING_CREATOR_ROLE to owner & deployer', async function () {
    const {
      vesting,
      owner,
      deployer
    } = await loadFixture(deployVestingContract)

    const vestingCreators = await vesting.getRoleMembers(
      await vesting.VESTING_CREATOR_ROLE()
    )

    expect(vestingCreators).to.deep.equal([ owner.address, deployer.address ])
  })

  it('Accepts and tracks vesting token', async function () {
    const {
      vesting,
      token
    } = await loadFixture(deployVestingContract)
    const tokenAddress = await token.getAddress()
    expect(await vesting.vestingToken()).to.equal(tokenAddress)
  })

  it('Sets owner as treasury address', async function () {
    const {
      vesting,
      owner
    } = await loadFixture(deployVestingContract)

    expect(await vesting.treasuryAddress()).to.equal(owner.address)
  })

  it('Sets VESTING_ADMIN_ROLE as the admin role for VESTING_CREATOR_ROLE', async function () {
    const { vesting } = await loadFixture(deployVestingContract)

    const vestingAdminRole = await vesting.VESTING_ADMIN_ROLE()
    const vestingCreatorRole = await vesting.VESTING_CREATOR_ROLE()

    expect(await vesting.getRoleAdmin(vestingCreatorRole)).to.equal(
      vestingAdminRole
    )
  })
})
