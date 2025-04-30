import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

import { deployPresaleContract } from './setup'

describe('Presale - Withdraw Utility', function () {
  it('Allows Presale Admins to withdraw ETH', async function () {
    const { presale, alice, owner } = await loadFixture(deployPresaleContract)

    const presaleAddress = await presale.getAddress()
    const initialBalance = await hre.ethers.provider.getBalance(owner.address)

    // Send some ETH to the contract
    await alice.sendTransaction({
      from: alice.address,
      to: presaleAddress,
      value: hre.ethers.parseEther('1.0')
    })

    // Check the contract's balance
    const contractBalance = await hre.ethers.provider.getBalance(presaleAddress)
    expect(contractBalance).to.equal(hre.ethers.parseEther('1.0'))

    // Withdraw ETH
    await presale.connect(owner).withdrawETH()

    // Check the owner's balance after withdrawal
    const finalBalance = await hre.ethers.provider.getBalance(owner.address)
    expect(finalBalance).to.be.gt(initialBalance)
  })

  it('Prevents others from withdrawing ETH', async function () {
    const { presale, alice } = await loadFixture(deployPresaleContract)

    const presaleAddress = await presale.getAddress()

    // Send some ETH to the contract
    await alice.sendTransaction({
      from: alice.address,
      to: presaleAddress,
      value: hre.ethers.parseEther('1.0')
    })

    // Check the contract's balance
    const contractBalance = await hre.ethers.provider.getBalance(presaleAddress)
    expect(contractBalance).to.equal(hre.ethers.parseEther('1.0'))

    // Attempt to withdraw ETH as a non-owner
    await expect(presale.connect(alice).withdrawETH()).to.be.reverted
  })

  it('Allows Presale Admins to withdraw ERC20', async function () {
    const { token, presale, owner } = await loadFixture(deployPresaleContract)

    const tokenAddress = await token.getAddress()
    const presaleAddress = await presale.getAddress()
    const initialBalance = await token.balanceOf(owner.address)

    // Transfer some tokens to the presale contract
    await token.connect(owner).transfer(presaleAddress, 1_000)

    // Check the presale contract's balance
    const contractBalance = await token.balanceOf(presaleAddress)
    expect(contractBalance).to.equal(1_000)

    // Withdraw ERC20 tokens
    await presale.connect(owner).withdrawERC20(tokenAddress)

    // Check the owner's balance after withdrawal
    const finalBalance = await token.balanceOf(owner.address)
    expect(finalBalance).to.equal(initialBalance)
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

    // Transfer some tokens to the presale contract
    await token.connect(owner).transfer(presaleAddress, 1_000)

    // Check the presale contract's balance
    const contractBalance = await token.balanceOf(presaleAddress)
    expect(contractBalance).to.equal(1_000)

    // Attempt to withdraw ERC20 tokens as a non-owner
    await expect(token.connect(alice).withdrawERC20(tokenAddress)).to.be.reverted
  })
})
