import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { deployPresaleContract } from './setup'

describe('Presale - Buying', function () {
  it('Allows buying when presale is active, tokens sent to vesting contract', async function () {
    const {
      presale,
      token,
      usdt,
      owner,
      alice,
      treasury,
      vesting,
      INITIAL_VESTING_DURATION,
      INITIAL_VESTING_CLIFF
    } = await loadFixture(deployPresaleContract)
    const vestingAddress = await vesting.getAddress()
    const usdtAddress = await usdt.getAddress()
    await usdt.mint(alice.address, ethers.parseUnits('1000', 6))

    const presaleAddress = await presale.getAddress()
    await token
      .connect(owner)
      .transfer(presaleAddress, ethers.parseUnits('1000000', 18))

    await presale.connect(owner).setTreasuryAddress(treasury.address)
    await presale.connect(owner).addPaymentToken(usdtAddress, 40_000)
    await presale.connect(owner).unpausePresale()
    expect(await presale.isPresalePaused()).to.be.false

    const buyAmount = ethers.parseUnits('3', 18)
    const usdtAmount = ethers.parseUnits('0.12', 6)
    await usdt.connect(alice).approve(presaleAddress, usdtAmount)
    const buyTx = await presale.connect(alice).buy(usdtAmount, usdtAddress)
    expect(buyTx).to.emit(presale, 'TokensPurchased').withArgs(
      alice.address,
      buyAmount,
      usdtAddress,
      usdtAmount,
      40_000
    )
    const buyBlock = await buyTx.getBlock()

    expect(
      await usdt.balanceOf(alice.address)
    ).to.equal(ethers.parseUnits('999.88', 6))
    expect(
      await usdt.balanceOf(treasury.address)
    ).to.equal(ethers.parseUnits('0.12', 6))
    expect(await token.balanceOf(alice.address)).to.equal(0)
    expect(await token.balanceOf(vestingAddress)).to.equal(buyAmount)
    const aliceVesting = await vesting.vestingSchedules(alice.address)
    expect(aliceVesting.totalAmount).to.equal(buyAmount)
    expect(aliceVesting.claimedAmount).to.equal(0)
    expect(aliceVesting.vestingDuration).to.equal(INITIAL_VESTING_DURATION)
    expect(aliceVesting.vestingCliff).to.equal(INITIAL_VESTING_CLIFF)
    expect(aliceVesting.initialized).to.equal(true)
    expect(aliceVesting.vestingStart).to.equal(buyBlock!.timestamp) // TODO -> should be block timestamp of buy tx
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
    await presale.connect(owner).pausePresale()
    expect(await presale.isPresalePaused()).to.be.true

    const usdtAmount = ethers.parseUnits('0.12', 6)
    await usdt.connect(alice).approve(presaleAddress, usdtAmount)

    await expect(
      presale.connect(alice).buy(usdtAmount, usdtAddress)
    ).to.be.revertedWithCustomError(presale, 'PresaleIsPaused')
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
    await presale.connect(owner).unpausePresale()
    expect(await presale.isPresalePaused()).to.be.false

    const usdtAmount = ethers.parseUnits('0.12', 6)
    await usdt.connect(alice).approve(presaleAddress, usdtAmount)

    await expect(
      presale.connect(alice).buy(usdtAmount, usdtAddress)
    ).to.be.revertedWithCustomError(
      presale,
      'AvailableTokensLessThanRequestedPurchaseAmount'
    ).withArgs(
      ethers.parseUnits('1', 18),
      ethers.parseUnits('3', 18)
    )
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

    await expect(presale.connect(alice).buy(usdtAmount, usdtAddress))
      .to.be.revertedWithCustomError(presale, 'InvalidPaymentToken')
      .withArgs(
        usdtAddress
      )
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
    await presale.connect(owner).unpausePresale()
    expect(await presale.isPresalePaused()).to.be.false

    const usdtAmount = ethers.parseUnits('0', 6)
    await usdt.connect(alice).approve(presaleAddress, usdtAmount)

    await expect(
      presale.connect(alice).buy(usdtAmount, usdtAddress)
    ).to.be.revertedWithCustomError(
      presale,
      'PaymentAmountLessThanMinimum'
    ).withArgs(
      ethers.parseUnits('0', 6),
      ethers.parseUnits('0.01', 6)
    )
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
    await presale.connect(owner).unpausePresale()
    expect(await presale.isPresalePaused()).to.be.false

    const usdtAmount = ethers.parseUnits('0.001', 6)
    await usdt.connect(alice).approve(presaleAddress, usdtAmount)

    await expect(
      presale.connect(alice).buy(usdtAmount, usdtAddress)
    ).to.be.revertedWithCustomError(
      presale,
      'PaymentAmountLessThanMinimum'
    ).withArgs(
      ethers.parseUnits('0.001', 6),
      ethers.parseUnits('0.01', 6)
    )
  })
})
