import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

import { deployTokenContract } from './setup'

describe('Token - Withdraw Utility', function () {
  it('Allows owner to withdraw ETH', async function () {
    const { token, alice, owner } = await loadFixture(deployTokenContract)

    const tokenAddress = await token.getAddress()
    const initialBalance = await hre.ethers.provider.getBalance(owner.address)

    // Send some ETH to the contract
    await alice.sendTransaction({
      from: alice.address,
      to: tokenAddress,
      value: hre.ethers.parseEther('1.0')
    })

    // Check the contract's balance
    const contractBalance = await hre.ethers.provider.getBalance(tokenAddress)
    expect(contractBalance).to.equal(hre.ethers.parseEther('1.0'))

    // Withdraw ETH
    await token.connect(owner).withdrawETH()

    // Check the owner's balance after withdrawal
    const finalBalance = await hre.ethers.provider.getBalance(owner.address)
    expect(finalBalance).to.be.gt(initialBalance)
  })

  it('Allows Token Admin to withdraw ETH')
  it('Prevents non-owners from withdrawing ETH', async function () {
    const { token, alice } = await loadFixture(deployTokenContract)

    const tokenAddress = await token.getAddress()

    // Send some ETH to the contract
    await alice.sendTransaction({
      from: alice.address,
      to: tokenAddress,
      value: hre.ethers.parseEther('1.0')
    })

    // Check the contract's balance
    const contractBalance = await hre.ethers.provider.getBalance(tokenAddress)
    expect(contractBalance).to.equal(hre.ethers.parseEther('1.0'))

    // Attempt to withdraw ETH as a non-owner
    await expect(token.connect(alice).withdrawETH()).to.be.reverted
  })

  it('Allows owner to withdraw ERC20', async function () {
    const { token, owner } = await loadFixture(deployTokenContract)

    const tokenAddress = await token.getAddress()
    const initialBalance = await token.balanceOf(owner.address)

    // Transfer some tokens to the contract
    await token.connect(owner).transfer(tokenAddress, 1_000)

    // Check the contract's balance
    const contractBalance = await token.balanceOf(tokenAddress)
    expect(contractBalance).to.equal(1_000)

    // Withdraw ERC20 tokens
    await token.connect(owner).withdrawERC20(tokenAddress)

    // Check the owner's balance after withdrawal
    const finalBalance = await token.balanceOf(owner.address)
    expect(finalBalance).to.equal(initialBalance)
  })
  it('Allows Token Admin to withdraw ERC20')
  it('Prevents non-owners from withdrawing ERC20', async function () {
    const { token, alice, owner } = await loadFixture(deployTokenContract)

    const tokenAddress = await token.getAddress()

    // Transfer some tokens to the contract
    await token.connect(owner).transfer(tokenAddress, 1_000)

    // Check the contract's balance
    const contractBalance = await token.balanceOf(tokenAddress)
    expect(contractBalance).to.equal(1_000)

    // Attempt to withdraw ERC20 tokens as a non-owner
    await expect(token.connect(alice).withdrawERC20(tokenAddress)).to.be.reverted
  })
})
