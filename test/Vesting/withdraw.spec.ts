import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'

import { deployVestingContract } from './setup'
import { deployMockStablecoinContract } from '../util'

describe('Vesting - Withdraw Utility', function () {
  it('Allows Vesting Admins to withdraw alternate ERC20', async function () {
    const { vesting, owner } = await loadFixture(deployVestingContract)

    const {
      mockStablecoin
    } = await deployMockStablecoinContract('MOCK', 'MOCK', 1_000_000)()

    const mockStablecoinAddress = await mockStablecoin.getAddress()
    const vestingAddress = await vesting.getAddress()

    // Transfer some tokens to the contract
    await mockStablecoin.connect(owner).mint(vestingAddress, 1_000)

    // Check the contract's balance
    const contractBalance = await mockStablecoin.balanceOf(vestingAddress)
    expect(contractBalance).to.equal(1_000)

    // Withdraw ERC20 tokens
    await vesting.connect(owner).withdrawERC20(mockStablecoinAddress)

    // Check the owner's balance after withdrawal
    const finalBalance = await mockStablecoin.balanceOf(owner.address)
    expect(finalBalance).to.equal(1_000)
  })

  it('Prevents others from withdrawing alternate ERC20', async function () {
    const { vesting, alice, owner } = await loadFixture(deployVestingContract)

    const {
      mockStablecoin
    } = await deployMockStablecoinContract('MOCK', 'MOCK', 1_000_000)()

    const mockStablecoinAddress = await mockStablecoin.getAddress()
    const vestingAddress = await vesting.getAddress()

    // Transfer some tokens to the contract
    await mockStablecoin.connect(owner).mint(vestingAddress, 1_000)

    // Check the contract's balance
    const contractBalance = await mockStablecoin.balanceOf(vestingAddress)
    expect(contractBalance).to.equal(1_000)

    // Attempt to withdraw ERC20 tokens as a non-owner
    await expect(vesting.connect(alice).withdrawERC20(mockStablecoinAddress))
      .to.be.revertedWithCustomError(
        vesting,
        'AccessControlUnauthorizedAccount'
      )
  })

  it('Prevents Vesting Admins from withdrawing vested tokens', async function () {
    const { vesting, token, owner } = await loadFixture(deployVestingContract)

    const tokenAddress = await token.getAddress()
    const vestingAddress = await vesting.getAddress()

    // Transfer some tokens to the contract
    await token.connect(owner).transfer(vestingAddress, 1_000)

    // Check the contract's balance
    const contractBalance = await token.balanceOf(vestingAddress)
    expect(contractBalance).to.equal(1_000)

    // Attempt to withdraw vested tokens as owner
    await expect(vesting.connect(owner).withdrawERC20(tokenAddress))
      .to.be.revertedWithCustomError(
        vesting,
        'CannotWithdrawVestingToken'
      )
  })

  it('Prevents others from withdrawing vested tokens', async function () {
    const { vesting, token, alice, owner } = await loadFixture(deployVestingContract)

    const tokenAddress = await token.getAddress()
    const vestingAddress = await vesting.getAddress()

    // Transfer some tokens to the contract
    await token.connect(owner).transfer(vestingAddress, 1_000)

    // Check the contract's balance
    const contractBalance = await token.balanceOf(vestingAddress)
    expect(contractBalance).to.equal(1_000)

    // Attempt to withdraw vested tokens as a non-owner
    await expect(vesting.connect(alice).withdrawERC20(tokenAddress))
      .to.be.revertedWithCustomError(
        vesting,
        'AccessControlUnauthorizedAccount'
      )
  })
})
