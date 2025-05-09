import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'

import { deployVestingContract } from './setup'

describe('Presale - Management', function () {
  describe('Treasury Address', function () {
    it('Allows Presale Admins to set treasury address', async function () {
      const { vesting, owner, alice } = await loadFixture(deployVestingContract)

      await expect(
        vesting.connect(owner).setTreasuryAddress(alice.address)
      ).to.emit(vesting, 'TreasuryAddressSet').withArgs(alice.address)

      expect(await vesting.treasuryAddress()).to.equal(alice.address)
    })

    it('Prevents others from setting treasury address', async function () {
      const { vesting, alice } = await loadFixture(deployVestingContract)

      await expect(
        vesting.connect(alice).setTreasuryAddress(alice.address)
      ).to.be.revertedWithCustomError(
        vesting,
        'AccessControlUnauthorizedAccount'
      )
    })
  })
})
