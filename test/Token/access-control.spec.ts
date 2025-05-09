import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'

import { deployTokenContract } from './setup'

describe('Token - Access Control', function () {
  it('Allows owner to add Token Admins', async function () {
    const {
      token,
      owner,
      alice
    } = await loadFixture(deployTokenContract)
    const tokenAdminRole = await token.TOKEN_ADMIN_ROLE()

    await token.connect(owner).grantRole(tokenAdminRole, alice.address)

    const tokenAdmins = await token.getRoleMembers(tokenAdminRole)
    expect(tokenAdmins).to.deep.equal([ owner.address, alice.address ])
  })

  it('Prevents non-owners from adding Token Admins', async function () {
    const {
      token,
      alice
    } = await loadFixture(deployTokenContract)

    await expect(
      token.connect(alice).grantRole(await token.TOKEN_ADMIN_ROLE(), alice.address)
    ).to.be.revertedWithCustomError(
      token,
      'AccessControlUnauthorizedAccount'
    )
  })

  it('Allows owner to remove Token Admins', async function () {
    const {
      token,
      owner,
      alice
    } = await loadFixture(deployTokenContract)
    const tokenAdminRole = await token.TOKEN_ADMIN_ROLE()

    await token.connect(owner).grantRole(tokenAdminRole, alice.address)
    const tokenAdminsBefore = await token.getRoleMembers(tokenAdminRole)
    expect(tokenAdminsBefore).to.deep.equal([ owner.address, alice.address ])

    await token.connect(owner).revokeRole(tokenAdminRole, alice.address)
    const tokenAdmins = await token.getRoleMembers(tokenAdminRole)
    expect(tokenAdmins).to.deep.equal([ owner.address ])
  })

  it('Prevents non-owners from removing Token Admins', async function () {
    const {
      token,
      owner,
      alice,
      bob
    } = await loadFixture(deployTokenContract)
    const tokenAdminRole = await token.TOKEN_ADMIN_ROLE()

    await token.connect(owner).grantRole(tokenAdminRole, alice.address)
    const tokenAdminsBefore = await token.getRoleMembers(tokenAdminRole)
    expect(tokenAdminsBefore).to.deep.equal([ owner.address, alice.address ])

    await expect(
      token.connect(bob).revokeRole(tokenAdminRole, alice.address)
    ).to.be.revertedWithCustomError(
      token,
      'AccessControlUnauthorizedAccount'
    )
  })
})
