import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'

import { deployTokenContract } from './setup'

describe('Presale - Management', function () {
  describe('Treasury Address', function () {
    it('Allows Presale Admins to set treasury address', async function () {
      const { token, owner, alice } = await loadFixture(deployTokenContract)

      await expect(
        token.connect(owner).setTreasuryAddress(alice.address)
      ).to.emit(token, 'TreasuryAddressSet').withArgs(alice.address)

      expect(await token.treasuryAddress()).to.equal(alice.address)
    })

    it('Prevents others from setting treasury address', async function () {
      const { token, alice } = await loadFixture(deployTokenContract)

      await expect(
        token.connect(alice).setTreasuryAddress(alice.address)
      ).to.be.revertedWithCustomError(
        token,
        'AccessControlUnauthorizedAccount'
      )
    })
  })
})
