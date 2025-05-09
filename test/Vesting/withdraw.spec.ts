import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

import { deployVestingContract } from './setup'

describe('Vesting - Withdraw Utility', function () {
  it('Allows Vesting Admins to withdraw ERC20', async function () {
    const { vesting, token, owner } = await loadFixture(deployVestingContract)

    const tokenAddress = await token.getAddress()
    const vestingAddress = await vesting.getAddress()
    const initialBalance = await token.balanceOf(owner.address)

    // Transfer some tokens to the contract
    await token.connect(owner).transfer(vestingAddress, 1_000)

    // Check the contract's balance
    const contractBalance = await token.balanceOf(vestingAddress)
    expect(contractBalance).to.equal(1_000)

    // Withdraw ERC20 tokens
    await vesting.connect(owner).withdrawERC20(tokenAddress)

    // Check the owner's balance after withdrawal
    const finalBalance = await token.balanceOf(owner.address)
    expect(finalBalance).to.equal(initialBalance)
  })

  it('Prevents others from withdrawing ERC20', async function () {
    const { token, vesting, alice, owner } = await loadFixture(deployVestingContract)

    const vestingAddress = await vesting.getAddress()
    const tokenAddress = await token.getAddress()

    // Transfer some tokens to the contract
    await token.connect(owner).transfer(vestingAddress, 1_000)

    // Check the contract's balance
    const contractBalance = await token.balanceOf(vestingAddress)
    expect(contractBalance).to.equal(1_000)

    // Attempt to withdraw ERC20 tokens as a non-owner
    await expect(vesting.connect(alice).withdrawERC20(tokenAddress))
      .to.be.revertedWithCustomError(
        vesting,
        'AccessControlUnauthorizedAccount'
      )
  })
})
