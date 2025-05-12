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

      await presale.connect(owner).setVestingContractAddress(ethers.ZeroAddress)

      expect(await presale.isPresalePaused()).to.be.true
      await expect(
        presale.connect(owner).unpausePresale()
      ).to.be.revertedWithCustomError(
        presale,
        'VestingContractAddressNotSet'
      )
    })

    it('Prevents presale from starting without being set as Vesting Admin on Vesting contract', async function () {
      const { presale, owner, vesting } = await loadFixture(deployPresaleContractWithoutVestingAddress)
      const vestingAddress = await vesting.getAddress()
      await presale.connect(owner).setVestingContractAddress(vestingAddress)

      expect(await presale.isPresalePaused()).to.be.true
      await expect(
        presale.connect(owner).unpausePresale()
      ).to.be.revertedWithCustomError(
        presale,
        'PresaleContractDoesNotHaveVestingAdminRoleinVestingContract'
      )
    })

    it('Prevents presale from starting without tokens', async function () {
      const { presale, owner, vesting } = await loadFixture(deployPresaleContractWithoutVestingAddress)
      const vestingAddress = await vesting.getAddress()
      const presaleAddress = await presale.getAddress()
      await presale.connect(owner).setVestingContractAddress(vestingAddress)
      await vesting.connect(owner).grantRole(
        ethers.id('VESTING_ADMIN_ROLE'),
        presaleAddress
      )

      expect(await presale.isPresalePaused()).to.be.true
      await expect(
        presale.connect(owner).unpausePresale()
      ).to.be.revertedWithCustomError(
        presale,
        'PresaleContractDoesNotHaveTokens'
      )
    })

    it('Allows Presale Admins to pause presale', async function () {
      const { presale, owner } = await loadFixture(deployPresaleContract)

      expect(await presale.isPresalePaused()).to.be.true
      await presale.connect(owner).unpausePresale()
      expect(await presale.isPresalePaused()).to.be.false

      await expect(
        presale.connect(owner).pausePresale()
      ).to.emit(presale, 'PresalePaused')

      expect(await presale.isPresalePaused()).to.be.true
    })

    it('Prevents others from pausing presale', async function () {
      const { presale, alice } = await loadFixture(deployPresaleContract)

      await expect(presale.connect(alice).pausePresale())
        .to.be.revertedWithCustomError(
          presale,
          'AccessControlUnauthorizedAccount'
        )
    })

    it('Allows Presale Admins to unpause presale', async function () {
      const { presale, owner } = await loadFixture(deployPresaleContract)
      expect(await presale.isPresalePaused()).to.be.true
      await presale.connect(owner).unpausePresale()
      expect(await presale.isPresalePaused()).to.be.false
      await presale.connect(owner).pausePresale()
      expect(await presale.isPresalePaused()).to.be.true

      await expect(
        presale.connect(owner).unpausePresale()
      ).to.emit(presale, 'PresaleUnpaused')
      expect(await presale.isPresalePaused()).to.be.false
    })

    it('Prevents others from unpausing presale', async function () {
      const { presale, alice, owner } = await loadFixture(deployPresaleContract)

      await presale.connect(owner).pausePresale()
      expect(await presale.isPresalePaused()).to.be.true

      await expect(presale.connect(alice).unpausePresale())
        .to.be.revertedWithCustomError(
          presale,
          'AccessControlUnauthorizedAccount'
        )
      expect(await presale.isPresalePaused()).to.be.true
    })
  })

  describe('Treasury Address', function () {
    it('Allows Presale Admins to set treasury address', async function () {
      const { presale, owner, alice } = await loadFixture(deployPresaleContract)

      await expect(
        presale.connect(owner).setTreasuryAddress(alice.address)
      ).to.emit(presale, 'TreasuryAddressSet').withArgs(alice.address)

      expect(await presale.treasuryAddress()).to.equal(alice.address)
    })

    it('Prevents others from setting treasury address', async function () {
      const { presale, alice } = await loadFixture(deployPresaleContract)

      await expect(
        presale.connect(alice).setTreasuryAddress(alice.address)
      ).to.be.revertedWithCustomError(
        presale,
        'AccessControlUnauthorizedAccount'
      )
    })
  })

  describe('Add/Remove Payment Tokens & Rates', function () {
    it('Allows Presale Admins to add payment tokens & rates', async function () {
      const { presale, owner, usdt, usdc } = await loadFixture(deployPresaleContract)
      const usdtAddress = await usdt.getAddress()
      const usdcAddress = await usdc.getAddress()

      await expect(
        presale.connect(owner).addPaymentToken(usdtAddress, 1)
      ).to.emit(presale, 'PaymentTokenAdded').withArgs(
        usdtAddress,
        1
      )
      await expect(
        presale.connect(owner).addPaymentToken(usdcAddress, 2)
      ).to.emit(presale, 'PaymentTokenAdded').withArgs(
        usdcAddress,
        2
      )

      const usdtPaymentTokenRate = await presale.paymentTokenRates(usdtAddress)
      const usdcPaymentTokenRate = await presale.paymentTokenRates(usdcAddress)
      expect(usdtPaymentTokenRate).to.equal(1)
      expect(usdcPaymentTokenRate).to.equal(2)
    })

    it('Prevents others from adding Payment tokens & rates', async function () {
      const { presale, alice, usdt } = await loadFixture(deployPresaleContract)
      const usdtAddress = await usdt.getAddress()

      await expect(
        presale.connect(alice).addPaymentToken(usdtAddress, 1)
      ).to.be.revertedWithCustomError(
        presale,
        'AccessControlUnauthorizedAccount'
      )
    })

    it('Allows Presale Admins to remove Payment tokens & rates', async function () {
      const { presale, owner, usdt, usdc } = await loadFixture(deployPresaleContract)
      const usdtAddress = await usdt.getAddress()
      const usdcAddress = await usdc.getAddress()

      await presale.connect(owner).addPaymentToken(usdtAddress, 1)
      await presale.connect(owner).addPaymentToken(usdcAddress, 2)
      const usdtPaymentTokenRateBefore = await presale.paymentTokenRates(usdtAddress)
      const usdcPaymentTokenRateBefore = await presale.paymentTokenRates(usdcAddress)
      expect(usdtPaymentTokenRateBefore).to.equal(1)
      expect(usdcPaymentTokenRateBefore).to.equal(2)

      await expect(
        presale.connect(owner).removePaymentToken(usdtAddress)
      ).to.emit(presale, 'PaymentTokenRemoved').withArgs(
        usdtAddress
      )
      const usdtPaymentTokenRateAfter = await presale.paymentTokenRates(usdtAddress)
      const usdcPaymentTokenRateAfter = await presale.paymentTokenRates(usdcAddress)
      expect(usdtPaymentTokenRateAfter).to.equal(0)
      expect(usdcPaymentTokenRateAfter).to.equal(2)
    })

    it('Prevents others from removing Payment tokens & rates', async function () {
      const { presale, alice, usdt } = await loadFixture(deployPresaleContract)
      const usdtAddress = await usdt.getAddress()

      await expect(
        presale.connect(alice).removePaymentToken(usdtAddress)
      ).to.be.revertedWithCustomError(
        presale,
        'AccessControlUnauthorizedAccount'
      )
    })
  })

  describe('Setting Presale Vesting Schedule Parameters', function () {
    it('Allows Presale Admins to set vesting contract address', async function () {
      const { presale, owner, vesting } = await loadFixture(deployPresaleContract)
      const vestingAddress = await vesting.getAddress()

      await expect(
        presale.connect(owner).setVestingContractAddress(vestingAddress)
      ).to.emit(presale, 'VestingContractAddressSet').withArgs(vestingAddress)

      expect(await presale.vestingContractAddress()).to.equal(vestingAddress)
    })

    it('Prevents others from setting vesting contract address', async function () {
      const { presale, alice, vesting } = await loadFixture(deployPresaleContract)
      const vestingAddress = await vesting.getAddress()

      await expect(
        presale.connect(alice).setVestingContractAddress(vestingAddress)
      ).to.be.revertedWithCustomError(
        presale,
        'AccessControlUnauthorizedAccount'
      )
    })

    it('Allows Presale Admins to set vesting schedule parameters', async function () {
      const { presale, owner } = await loadFixture(deployPresaleContract)

      const newVestingDuration = 60 * 60 * 24 // 1 day
      const newVestingCliff = 60 * 60 // 1 hour

      await expect(
        presale.connect(owner).setVestingScheduleParameters(
          newVestingDuration,
          newVestingCliff
        )
      ).to.emit(presale, 'VestingScheduleParametersSet').withArgs(
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
