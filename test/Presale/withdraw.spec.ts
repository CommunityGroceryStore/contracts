import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

import { deployPresaleContract } from './setup'

describe('Presale - Withdraw Utility', function () {
  it('Allows Presale Admins to withdraw ERC20', async function () {
    const { token, presale, owner } = await loadFixture(deployPresaleContract)

    const tokenAddress = await token.getAddress()
    const presaleAddress = await presale.getAddress()
    const initialBalance = await token.balanceOf(owner.address)

    const contractBalanceBefore = await token.balanceOf(presaleAddress)

    // Transfer some tokens to the presale contract
    await token.connect(owner).transfer(presaleAddress, 1_000)

    // Check the presale contract's balance
    const contractBalance = await token.balanceOf(presaleAddress)
    expect(contractBalance).to.equal(contractBalanceBefore + 1_000n)

    // Withdraw ERC20 tokens
    await presale.connect(owner).withdrawERC20(tokenAddress)

    // Check the owner's balance after withdrawal
    const finalBalance = await token.balanceOf(owner.address)
    expect(finalBalance).to.equal(initialBalance + contractBalanceBefore)
  })

  it('Prevents others from withdrawing other ERC20', async function () {
    const {
      token,
      presale,
      alice,
      owner
    } = await loadFixture(deployPresaleContract)

    const tokenAddress = await token.getAddress()
    const presaleAddress = await presale.getAddress()

    const contractBalanceBefore = await token.balanceOf(presaleAddress)

    // Transfer some tokens to the presale contract
    await token.connect(owner).transfer(presaleAddress, 1_000)

    // Check the presale contract's balance
    const contractBalance = await token.balanceOf(presaleAddress)
    expect(contractBalance).to.equal(contractBalanceBefore + 1_000n)

    // Attempt to withdraw ERC20 tokens as a non-owner
    await expect(
      presale.connect(alice).withdrawERC20(tokenAddress)
    ).to.be.revertedWithCustomError(
      presale,
      'AccessControlUnauthorizedAccount'
    )
  })
})
