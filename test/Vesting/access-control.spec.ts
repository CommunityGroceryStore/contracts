import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'

import { deployVestingContract } from './setup'

describe('Vesting - Access Control', function () {
  it('Allows owner to add Vesting Admins', async function () {
    const {
      vesting,
      owner,
      alice
    } = await loadFixture(deployVestingContract)
    const tokenAdminRole = await vesting.VESTING_ADMIN_ROLE()

    await vesting.connect(owner).grantRole(tokenAdminRole, alice.address)

    const tokenAdmins = await vesting.getRoleMembers(tokenAdminRole)
    expect(tokenAdmins).to.deep.equal([ owner.address, alice.address ])
  })

  it('Prevents non-owners from adding Vesting Admins', async function () {
    const {
      vesting,
      alice
    } = await loadFixture(deployVestingContract)

    await expect(
      vesting.connect(alice).grantRole(await vesting.VESTING_ADMIN_ROLE(), alice.address)
    ).to.be.reverted
  })

  it('Allows owner to remove Vesting Admins', async function () {
    const {
      vesting,
      owner,
      alice
    } = await loadFixture(deployVestingContract)
    const tokenAdminRole = await vesting.VESTING_ADMIN_ROLE()

    await vesting.connect(owner).grantRole(tokenAdminRole, alice.address)
    const tokenAdminsBefore = await vesting.getRoleMembers(tokenAdminRole)
    expect(tokenAdminsBefore).to.deep.equal([ owner.address, alice.address ])

    await vesting.connect(owner).revokeRole(tokenAdminRole, alice.address)
    const tokenAdmins = await vesting.getRoleMembers(tokenAdminRole)
    expect(tokenAdmins).to.deep.equal([ owner.address ])
  })

  it('Prevents non-owners from removing Vesting Admins', async function () {
    const {
      vesting,
      owner,
      alice,
      bob
    } = await loadFixture(deployVestingContract)
    const tokenAdminRole = await vesting.VESTING_ADMIN_ROLE()

    await vesting.connect(owner).grantRole(tokenAdminRole, alice.address)
    const tokenAdminsBefore = await vesting.getRoleMembers(tokenAdminRole)
    expect(tokenAdminsBefore).to.deep.equal([ owner.address, alice.address ])

    await expect(
      vesting.connect(bob).revokeRole(tokenAdminRole, alice.address)
    ).to.be.reverted
  })
})
