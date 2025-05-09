import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'

import { deployPresaleContract } from './setup'

describe('Presale - Access Control', function () {
  it('Allows owner to add Presale Admins', async function () {
    const {
      presale,
      owner,
      alice
    } = await loadFixture(deployPresaleContract)
    const presaleAdminRole = await presale.PRESALE_ADMIN_ROLE()

    await presale.connect(owner).grantRole(presaleAdminRole, alice.address)

    const presaleAdmins = await presale.getRoleMembers(presaleAdminRole)
    expect(presaleAdmins).to.deep.equal([ owner.address, alice.address ])
  })

  it('Prevents non-owners from adding Presale Admins', async function () {
    const {
      presale,
      alice
    } = await loadFixture(deployPresaleContract)

    await expect(
      presale.connect(alice).grantRole(await presale.PRESALE_ADMIN_ROLE(), alice.address)
    ).to.be.revertedWithCustomError(presale, 'AccessControlUnauthorizedAccount')
  })

  it('Allows owner to remove Presale Admins', async function () {
    const {
      presale,
      owner,
      alice
    } = await loadFixture(deployPresaleContract)
    const presaleAdminRole = await presale.PRESALE_ADMIN_ROLE()

    await presale.connect(owner).grantRole(presaleAdminRole, alice.address)
    const presaleAdminsBefore = await presale.getRoleMembers(presaleAdminRole)
    expect(presaleAdminsBefore).to.deep.equal([ owner.address, alice.address ])

    await presale.connect(owner).revokeRole(presaleAdminRole, alice.address)
    const presaleAdmins = await presale.getRoleMembers(presaleAdminRole)
    expect(presaleAdmins).to.deep.equal([ owner.address ])
  })

  it('Prevents non-owners from removing Presale Admins', async function () {
    const {
      presale,
      owner,
      alice,
      bob
    } = await loadFixture(deployPresaleContract)
    const presaleAdminRole = await presale.PRESALE_ADMIN_ROLE()

    await presale.connect(owner).grantRole(presaleAdminRole, alice.address)
    const presaleAdminsBefore = await presale.getRoleMembers(presaleAdminRole)
    expect(presaleAdminsBefore).to.deep.equal([ owner.address, alice.address ])

    await expect(
      presale.connect(bob).revokeRole(presaleAdminRole, alice.address)
    ).to.be.revertedWithCustomError(presale, 'AccessControlUnauthorizedAccount')
  })
})
