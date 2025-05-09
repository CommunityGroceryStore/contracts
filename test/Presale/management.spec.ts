import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import {
  deployPresaleContract,
  deployPresaleContractWithoutVestingAddress
} from './setup'

describe('Presale - Management', function () {
  describe('Pause/Unpause', function () {
    it('Prevents presale from starting without vesting contract address', async function () {
      const { presale, owner } = await loadFixture(deployPresaleContractWithoutVestingAddress)

      expect(await presale.isPresalePaused()).to.be.true
      await expect(
        presale.connect(owner).unpausePresale()
      ).to.be.revertedWith('Vesting contract address not set')
    })

    it('Prevents presale from starting without being set as Vesting Admin on Vesting contract', async function () {
      const { presale, owner, vesting } = await loadFixture(deployPresaleContractWithoutVestingAddress)
      const vestingAddress = await vesting.getAddress()
      await presale.connect(owner).setVestingContractAddress(vestingAddress)

      expect(await presale.isPresalePaused()).to.be.true
      await expect(
        presale.connect(owner).unpausePresale()
      ).to.be.revertedWith(
        'Presale contract must have VESTING_ADMIN_ROLE in vesting contract'
      )
    })

    it('Allows Presale Admins to pause presale', async function () {
      const { presale, owner } = await loadFixture(deployPresaleContract)

      expect(await presale.isPresalePaused()).to.be.true
      await presale.connect(owner).unpausePresale()
      expect(await presale.isPresalePaused()).to.be.false

      await presale.connect(owner).pausePresale()

      expect(await presale.isPresalePaused()).to.be.true
    })

    it('Prevents others from pausing presale', async function () {
      const { presale, alice } = await loadFixture(deployPresaleContract)

      await expect(presale.connect(alice).pausePresale()).to.be.reverted
    })

    it('Allows Presale Admins to unpause presale', async function () {
      const { presale, owner } = await loadFixture(deployPresaleContract)
      expect(await presale.isPresalePaused()).to.be.true
      await presale.connect(owner).unpausePresale()
      expect(await presale.isPresalePaused()).to.be.false
      await presale.connect(owner).pausePresale()
      expect(await presale.isPresalePaused()).to.be.true

      await presale.connect(owner).unpausePresale()
      expect(await presale.isPresalePaused()).to.be.false
    })

    it('Prevents others from unpausing presale', async function () {
      const { presale, alice, owner } = await loadFixture(deployPresaleContract)

      await presale.connect(owner).pausePresale()
      expect(await presale.isPresalePaused()).to.be.true

      await expect(presale.connect(alice).unpausePresale()).to.be.reverted
      expect(await presale.isPresalePaused()).to.be.true
    })
  })

  describe('Treasury Address', function () {
    it('Allows Presale Admins to set treasury address', async function () {
      const { presale, owner, alice } = await loadFixture(deployPresaleContract)

      await presale.connect(owner).setTreasuryAddress(alice.address)

      expect(await presale.treasuryAddress()).to.equal(alice.address)
    })

    it('Prevents others from setting treasury address', async function () {
      const { presale, alice } = await loadFixture(deployPresaleContract)

      await expect(
        presale.connect(alice).setTreasuryAddress(alice.address)
      ).to.be.reverted
    })
  })

  describe('Add/Remove Purchase Tokens & Rates', function () {
    it('Allows Presale Admins to add purchase tokens & rates', async function () {
      const { presale, owner, usdt, usdc } = await loadFixture(deployPresaleContract)
      const usdtAddress = await usdt.getAddress()
      const usdcAddress = await usdc.getAddress()

      await presale.connect(owner).addPaymentToken(usdtAddress, 1)
      await presale.connect(owner).addPaymentToken(usdcAddress, 2)

      const usdtPaymentToken = await presale.paymentTokens(usdtAddress)
      const usdcPaymentToken = await presale.paymentTokens(usdcAddress)
      expect(usdtPaymentToken.paymentTokenRate).to.equal(1)
      expect(usdcPaymentToken.paymentTokenRate).to.equal(2)
    })

    it('Prevents others from adding purchase tokens & rates', async function () {
      const { presale, alice, usdt } = await loadFixture(deployPresaleContract)
      const usdtAddress = await usdt.getAddress()

      await expect(
        presale.connect(alice).addPaymentToken(usdtAddress, 1)
      ).to.be.reverted
    })

    it('Allows Presale Admins to remove purchase tokens & rates', async function () {
      const { presale, owner, usdt, usdc } = await loadFixture(deployPresaleContract)
      const usdtAddress = await usdt.getAddress()
      const usdcAddress = await usdc.getAddress()

      await presale.connect(owner).addPaymentToken(usdtAddress, 1)
      await presale.connect(owner).addPaymentToken(usdcAddress, 2)
      const usdtPaymentTokenBefore = await presale.paymentTokens(usdtAddress)
      const usdcPaymentTokenBefore = await presale.paymentTokens(usdcAddress)
      expect(usdtPaymentTokenBefore.paymentTokenRate).to.equal(1)
      expect(usdcPaymentTokenBefore.paymentTokenRate).to.equal(2)

      await presale.connect(owner).removePaymentToken(usdtAddress)
      const usdtPaymentTokenAfter = await presale.paymentTokens(usdtAddress)
      const usdcPaymentTokenAfter = await presale.paymentTokens(usdcAddress)
      expect(usdtPaymentTokenAfter.paymentTokenRate).to.equal(0)
      expect(usdtPaymentTokenAfter.paymentTokenAddress).to.be.equal(ethers.ZeroAddress)
      expect(usdcPaymentTokenAfter.paymentTokenRate).to.equal(2)
    })

    it('Prevents others from removing purchase tokens & rates', async function () {
      const { presale, alice, usdt } = await loadFixture(deployPresaleContract)
      const usdtAddress = await usdt.getAddress()

      await expect(
        presale.connect(alice).removePaymentToken(usdtAddress)
      ).to.be.reverted
    })
  })

  describe('Setting Presale Vesting Schedule Parameters', function () {
    it('Allows Presale Admins to set vesting schedule parameters', async function () {
      const { presale, owner } = await loadFixture(deployPresaleContract)

      const newVestingDuration = 60 * 60 * 24 // 1 day
      const newVestingCliff = 60 * 60 // 1 hour

      await presale.connect(owner).setVestingScheduleParameters(
        newVestingDuration,
        newVestingCliff
      )

      const vestingSchedule = await presale.vestingSchedule()
      expect(vestingSchedule.vestingDuration).to.equal(newVestingDuration)
      expect(vestingSchedule.vestingCliff).to.equal(newVestingCliff)
    })

    it('Prevents others from setting vesting schedule parameters', async function () {
      const { presale, alice } = await loadFixture(deployPresaleContract)

      const newVestingDuration = 60 * 60 * 24 // 1 day
      const newVestingCliff = 60 * 60 // 1 hour

      await expect(
        presale.connect(alice).setVestingScheduleParameters(
          newVestingDuration,
          newVestingCliff
        )
      ).to.be.revertedWithCustomError(
        presale,
        'AccessControlUnauthorizedAccount'
      )
    })

    it('Prevents setting vesting schedule parameters with cliff greater than duration', async function () {
      const { presale, owner } = await loadFixture(deployPresaleContract)

      const newVestingDuration = 60 * 60 // 1 hour
      const newVestingCliff = 60 * 60 * 24 // 1 day

      await expect(
        presale.connect(owner).setVestingScheduleParameters(
          newVestingDuration,
          newVestingCliff
        )
      ).to.be.revertedWithCustomError(
        presale,
        'VestingCliffMustBeLessThanOrEqualToDuration'
      )
    })
  })
})
