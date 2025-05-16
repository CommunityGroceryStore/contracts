import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'

import { deployVestingContract } from './setup'

describe('Vesting - Access Control', function () {
  describe('Vesting Admin Role', function () {
    it('Allows owner to add Vesting Admins', async function () {
      const {
        vesting,
        owner,
        alice,
        deployer
      } = await loadFixture(deployVestingContract)
      const tokenAdminRole = await vesting.VESTING_ADMIN_ROLE()

      await vesting.connect(owner).grantRole(tokenAdminRole, alice.address)

      const tokenAdmins = await vesting.getRoleMembers(tokenAdminRole)
      expect(tokenAdmins).to.deep.equal([
        owner.address,
        deployer.address,
        alice.address
      ])
    })

    it('Prevents non-owners from adding Vesting Admins', async function () {
      const {
        vesting,
        alice
      } = await loadFixture(deployVestingContract)

      await expect(
        vesting
          .connect(alice)
          .grantRole(await vesting.VESTING_ADMIN_ROLE(), alice.address)
      ).to.be.revertedWithCustomError(
        vesting,
        'AccessControlUnauthorizedAccount'
      )
    })

    it('Allows owner to remove Vesting Admins', async function () {
      const {
        vesting,
        owner,
        alice,
        deployer
      } = await loadFixture(deployVestingContract)
      const tokenAdminRole = await vesting.VESTING_ADMIN_ROLE()

      await vesting.connect(owner).grantRole(tokenAdminRole, alice.address)
      const tokenAdminsBefore = await vesting.getRoleMembers(tokenAdminRole)
      expect(tokenAdminsBefore).to.deep.equal([
        owner.address,
        deployer.address,
        alice.address
      ])

      await vesting.connect(owner).revokeRole(tokenAdminRole, alice.address)
      const tokenAdmins = await vesting.getRoleMembers(tokenAdminRole)
      expect(tokenAdmins).to.deep.equal([ owner.address, deployer.address ])
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

      await expect(
        vesting.connect(bob).revokeRole(tokenAdminRole, alice.address)
      ).to.be.revertedWithCustomError(
        vesting,
        'AccessControlUnauthorizedAccount'
      )
    })
  })

  describe('Vesting Creator Role', function () {
    it('Allows Vesting Admins to add Vesting Creators', async function () {
      const {
        vesting,
        owner,
        alice,
        bob,
        deployer
      } = await loadFixture(deployVestingContract)
      const vestingCreatorRole = await vesting.VESTING_CREATOR_ROLE()

      await vesting.connect(owner).grantRole(vestingCreatorRole, alice.address)
      await vesting.connect(owner).grantRole(vestingCreatorRole, bob.address)

      const vestingCreators = await vesting.getRoleMembers(vestingCreatorRole)
      expect(vestingCreators).to.deep.equal([
        owner.address,
        deployer.address,
        alice.address,
        bob.address
      ])
    })

    it('Prevents others from adding Vesting Creators', async function () {
      const {
        vesting,
        alice,
        bob
      } = await loadFixture(deployVestingContract)
      const vestingCreatorRole = await vesting.VESTING_CREATOR_ROLE()
      await expect(
        vesting
          .connect(alice)
          .grantRole(vestingCreatorRole, bob.address)
      ).to.be.revertedWithCustomError(
        vesting,
        'AccessControlUnauthorizedAccount'
      )
    })

    it('Allows Vesting Admins to remove Vesting Creators', async function () {
      const {
        vesting,
        owner,
        alice,
        bob,
        deployer
      } = await loadFixture(deployVestingContract)
      const vestingCreatorRole = await vesting.VESTING_CREATOR_ROLE()

      await vesting.connect(owner).grantRole(vestingCreatorRole, alice.address)
      await vesting.connect(owner).grantRole(vestingCreatorRole, bob.address)

      const vestingCreatorsBefore = await vesting.getRoleMembers(
        vestingCreatorRole
      )
      expect(vestingCreatorsBefore).to.deep.equal([
        owner.address,
        deployer.address,
        alice.address,
        bob.address
      ])

      await vesting.connect(owner).revokeRole(vestingCreatorRole, bob.address)

      const vestingCreators = await vesting.getRoleMembers(vestingCreatorRole)
      expect(vestingCreators).to.deep.equal([
        owner.address,
        deployer.address, 
        alice.address
      ])
    })

    it('Prevents others from removing Vesting Creators', async function () {
      const {
        vesting,
        owner,
        alice,
        bob,
        deployer
      } = await loadFixture(deployVestingContract)
      const vestingCreatorRole = await vesting.VESTING_CREATOR_ROLE()

      await vesting.connect(owner).grantRole(vestingCreatorRole, alice.address)
      await vesting.connect(owner).grantRole(vestingCreatorRole, bob.address)

      const vestingCreatorsBefore = await vesting.getRoleMembers(
        vestingCreatorRole
      )
      expect(vestingCreatorsBefore).to.deep.equal([
        owner.address,
        deployer.address,        
        alice.address,
        bob.address
      ])

      await expect(
        vesting.connect(alice).revokeRole(vestingCreatorRole, bob.address)
      ).to.be.revertedWithCustomError(
        vesting,
        'AccessControlUnauthorizedAccount'
      )
    })
  })
})
