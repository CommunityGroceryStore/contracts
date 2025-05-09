import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { deployPresaleContract } from './setup'

describe.only('Presale - Buying', function () {
  it('Allows buying when presale is active', async function () {
    const {
      presale,
      token,
      usdt,
      owner,
      alice,
      treasury
    } = await loadFixture(deployPresaleContract)
    const usdtAddress = await usdt.getAddress()
    await usdt.mint(alice.address, ethers.parseUnits('1000', 6))

    const presaleAddress = await presale.getAddress()
    await token.connect(owner).transfer(presaleAddress, ethers.parseUnits('1000', 18))

    await presale.connect(owner).setTreasuryAddress(treasury.address)
    await presale.connect(owner).addPaymentToken(usdtAddress, 40_000)
    expect((await presale.paymentTokens(usdtAddress)).tokenAddress).to.equal(usdtAddress)
    await presale.connect(owner).unpausePresale()
    expect(await presale.isPresalePaused()).to.be.false

    const buyAmount = ethers.parseUnits('3', 18)
    const usdtAmount = ethers.parseUnits('0.12', 6)
    await usdt.connect(alice).approve(presaleAddress, usdtAmount)
    await presale.connect(alice).buy(usdtAmount, usdtAddress)

    expect(await usdt.balanceOf(alice.address)).to.equal(ethers.parseUnits('999.88', 6))
    expect(await token.balanceOf(alice.address)).to.equal(buyAmount)
    expect(await usdt.balanceOf(treasury.address)).to.equal(ethers.parseUnits('0.12', 6))
  })

  it('Prevents buying when presale is paused', async function () {
    const {
      presale,
      token,
      usdt,
      owner,
      alice
    } = await loadFixture(deployPresaleContract)
    const usdtAddress = await usdt.getAddress()
    await usdt.mint(alice.address, ethers.parseUnits('1000', 6))

    const presaleAddress = await presale.getAddress()
    await token.connect(owner).transfer(presaleAddress, ethers.parseUnits('1000', 18))

    await presale.connect(owner).addPaymentToken(usdtAddress, 40_000)
    expect((await presale.paymentTokens(usdtAddress)).tokenAddress).to.equal(usdtAddress)
    await presale.connect(owner).pausePresale()
    expect(await presale.isPresalePaused()).to.be.true

    const usdtAmount = ethers.parseUnits('0.12', 6)
    await usdt.connect(alice).approve(presaleAddress, usdtAmount)

    await expect(
      presale.connect(alice).buy(usdtAmount, usdtAddress)
    ).to.be.revertedWith('Presale is paused')
  })

  it('Prevents buying when presale does not have enough tokens', async function () {
    const {
      presale,
      token,
      usdt,
      owner,
      alice
    } = await loadFixture(deployPresaleContract)
    const usdtAddress = await usdt.getAddress()
    await usdt.mint(alice.address, ethers.parseUnits('1000', 6))

    const presaleAddress = await presale.getAddress()
    await token.connect(owner).transfer(presaleAddress, ethers.parseUnits('1', 18))

    await presale.connect(owner).addPaymentToken(usdtAddress, 40_000)
    expect((await presale.paymentTokens(usdtAddress)).tokenAddress).to.equal(usdtAddress)
    await presale.connect(owner).unpausePresale()
    expect(await presale.isPresalePaused()).to.be.false

    const usdtAmount = ethers.parseUnits('0.12', 6)
    await usdt.connect(alice).approve(presaleAddress, usdtAmount)

    await expect(
      presale.connect(alice).buy(usdtAmount, usdtAddress)
    ).to.be.revertedWith('Insufficient tokens in contract')
  })

  it('Prevents buying with unknown purchase token', async function () {
    const {
      presale,
      token,
      usdt,
      owner,
      alice
    } = await loadFixture(deployPresaleContract)
    const usdtAddress = await usdt.getAddress()
    await usdt.mint(alice.address, ethers.parseUnits('1000', 6))

    const presaleAddress = await presale.getAddress()
    await token.connect(owner).transfer(presaleAddress, ethers.parseUnits('1000', 18))

    await presale.connect(owner).unpausePresale()
    expect(await presale.isPresalePaused()).to.be.false

    const usdtAmount = ethers.parseUnits('0.12', 6)
    await usdt.connect(alice).approve(presaleAddress, usdtAmount)

    await expect(
      presale.connect(alice).buy(usdtAmount, usdtAddress)
    ).to.be.revertedWith('Invalid payment token')
  })

  it('Prevents buying with zero amount', async function () {
    const {
      presale,
      token,
      usdt,
      owner,
      alice
    } = await loadFixture(deployPresaleContract)
    const usdtAddress = await usdt.getAddress()
    await usdt.mint(alice.address, ethers.parseUnits('1000', 6))

    const presaleAddress = await presale.getAddress()
    await token.connect(owner).transfer(presaleAddress, ethers.parseUnits('1000', 18))

    await presale.connect(owner).addPaymentToken(usdtAddress, 40_000)
    expect((await presale.paymentTokens(usdtAddress)).tokenAddress).to.equal(usdtAddress)
    await presale.connect(owner).unpausePresale()
    expect(await presale.isPresalePaused()).to.be.false

    const usdtAmount = ethers.parseUnits('0', 6)
    await usdt.connect(alice).approve(presaleAddress, usdtAmount)

    await expect(
      presale.connect(alice).buy(usdtAmount, usdtAddress)
    ).to.be.revertedWith('Invalid payment amount')
  })

  it('Prevents buying with too low amount', async function () {
    const {
      presale,
      token,
      usdt,
      owner,
      alice
    } = await loadFixture(deployPresaleContract)
    const usdtAddress = await usdt.getAddress()
    await usdt.mint(alice.address, ethers.parseUnits('1000', 6))

    const presaleAddress = await presale.getAddress()
    await token.connect(owner).transfer(presaleAddress, ethers.parseUnits('1000', 18))

    await presale.connect(owner).addPaymentToken(usdtAddress, 40_000)
    expect((await presale.paymentTokens(usdtAddress)).tokenAddress).to.equal(usdtAddress)
    await presale.connect(owner).unpausePresale()
    expect(await presale.isPresalePaused()).to.be.false

    const usdtAmount = ethers.parseUnits('0.0001', 6)
    await usdt.connect(alice).approve(presaleAddress, usdtAmount)

    await expect(
      presale.connect(alice).buy(usdtAmount, usdtAddress)
    ).to.be.revertedWith('Invalid payment amount')
  })
})
