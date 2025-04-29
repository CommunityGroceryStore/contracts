import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'

import { deployTokenContract } from './setup'

describe('Token - Deployment', function () {
  describe('Deployment', function () {
    it('Should mint total supply to owner', async function () {
      const {
        token,
        owner,
        TOTAL_SUPPLY_ATOMIC
      } = await loadFixture(deployTokenContract)

      expect(await token.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY_ATOMIC)
    })

    it('Should transfer ownership to owner', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.owner()).to.equal(owner.address)
    })

    it('Should deploy with decimals set to 18', async function () {
      const {
        token
      } = await loadFixture(deployTokenContract)

      expect(await token.decimals()).to.equal(18)
    })

    it('Should deploy with total supply of whole tokens of 1 billion (* 1e18)', async function () {
      const {
        token,
        TOTAL_SUPPLY
      } = await loadFixture(deployTokenContract)

      const totalSupplyAtomic = BigInt(TOTAL_SUPPLY) * BigInt(1e18)

      expect(await token.totalSupply()).to.equal(totalSupplyAtomic)
    })
  })
})
