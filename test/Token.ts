import {
  time,
  loadFixture,
} from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

describe('Token', function () {
  async function deploy() {
    const TOTAL_SUPPLY = 1_000_000_000

    // Contracts are deployed using the first signer/account by default
    const [ owner, otherAccount ] = await hre.ethers.getSigners()

    const Token = await hre.ethers.getContractFactory('CGSToken')
    const token = await Token.deploy(TOTAL_SUPPLY)

    return { token, TOTAL_SUPPLY, owner, otherAccount }
  }

  describe('Deployment', function () {
    it('Should mint total supply to deployer', async function () {
      const { token, owner, TOTAL_SUPPLY } = await loadFixture(deploy)

      expect(await token.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY)
    })
  })
})
