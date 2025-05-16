import {
  loadFixture,
  time
} from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { deployVestingContract } from './setup'

describe('Vesting - Token Vesting', function () {
  describe('Creating Vesting Schedules', function () {
    it('Allows Vesting Creator to add new vesting schedules', async function () {
      const {
        vesting,
        alice,
        owner,
        token
      } = await loadFixture(deployVestingContract)

      const vestingSchedule = {
        amount: ethers.parseUnits('1000', 18),
        startTime: Math.floor(Date.now() / 1000) + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 120 // 2 minutes from now
      }
      const vestingAddress = await vesting.getAddress()
      await token.connect(owner).approve(
        vestingAddress,
        vestingSchedule.amount
      )
      await expect(
        vesting.connect(owner).addVestingSchedule(
          alice.address,
          vestingSchedule.amount,
          vestingSchedule.startTime,
          vestingSchedule.duration,
          vestingSchedule.cliff
        )
      ).to.emit(vesting, 'VestingScheduleCreated').withArgs(
        alice.address,
        vestingSchedule.amount,
        vestingSchedule.startTime,
        vestingSchedule.duration,
        vestingSchedule.cliff
      )

      const {
        totalAmount,
        claimedAmount,
        vestingStart,
        vestingDuration,
        vestingCliff,
        initialized
      } = await vesting.vestingSchedules(alice.address)
      expect(totalAmount).to.equal(vestingSchedule.amount)
      expect(claimedAmount).to.equal(0)
      expect(vestingStart).to.equal(vestingSchedule.startTime)
      expect(vestingDuration).to.equal(vestingSchedule.duration)
      expect(vestingCliff).to.equal(vestingSchedule.cliff)
      expect(initialized).to.be.true
      expect(
        await token.balanceOf(vestingAddress)
      ).to.equal(vestingSchedule.amount)
    })

    it('Prevents anyone else from adding new vesting schedules', async function () {
      const {
        vesting,
        alice,
        token,
        owner
      } = await loadFixture(deployVestingContract)
      const vestingSchedule = {
        amount: ethers.parseUnits('1000', 18),
        startTime: Math.floor(Date.now() / 1000) + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 120 // 2 minutes from now
      }
      await token.connect(owner).transfer(alice.address, vestingSchedule.amount)
      const vestingAddress = await vesting.getAddress()
      await token.connect(alice).approve(
        vestingAddress,
        vestingSchedule.amount
      )
      await expect(
        vesting.connect(alice).addVestingSchedule(
          alice.address,
          vestingSchedule.amount,
          vestingSchedule.startTime,
          vestingSchedule.duration,
          vestingSchedule.cliff
        )
      ).to.be.revertedWithCustomError(
        vesting,
        'AccessControlUnauthorizedAccount'
      )
    })

    it('Prevents adding vesting schedules with zero token amount', async function () {
      const {
        vesting,
        alice,
        token,
        owner
      } = await loadFixture(deployVestingContract)
      const vestingSchedule = {
        amount: 0,
        startTime: Math.floor(Date.now() / 1000) + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 120 // 2 minutes from now
      }
      const vestingAddress = await vesting.getAddress()
      await token.connect(owner).approve(
        vestingAddress,
        vestingSchedule.amount
      )
      await expect(
        vesting.connect(owner).addVestingSchedule(
          alice.address,
          vestingSchedule.amount,
          vestingSchedule.startTime,
          vestingSchedule.duration,
          vestingSchedule.cliff
        )
      ).to.be.revertedWithCustomError(
        vesting,
        'VestingInvalidAmount'
      )
    })

    it('Prevents adding vesting schedules when not enough tokens to vest', async function () {
      const {
        vesting,
        alice,
        bob,
        token,
        owner
      } = await loadFixture(deployVestingContract)
      const vestingSchedule = {
        amount: ethers.parseUnits('1000', 18),
        startTime: Math.floor(Date.now() / 1000) + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 120 // 2 minutes from now
      }
      const vestingAddress = await vesting.getAddress()
      await vesting.connect(owner).grantRole(
        ethers.id('VESTING_CREATOR_ROLE'),
        alice.address
      )
      await token.connect(alice).approve(
        vestingAddress,
        vestingSchedule.amount
      )
      await expect(
        vesting.connect(alice).addVestingSchedule(
          bob.address,
          vestingSchedule.amount,
          vestingSchedule.startTime,
          vestingSchedule.duration,
          vestingSchedule.cliff
        )
      ).to.be.revertedWithCustomError(
        token,
        'ERC20InsufficientBalance'
      )
    })

    it('Prevents adding vesting schedules with cliff greater than duration', async function () {
      const {
        vesting,
        alice,
        token,
        owner
      } = await loadFixture(deployVestingContract)
      const vestingSchedule = {
        amount: ethers.parseUnits('1000', 18),
        startTime: Math.floor(Date.now() / 1000) + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 4000 // 2 minutes from now
      }
      const vestingAddress = await vesting.getAddress()
      await token.connect(owner).approve(
        vestingAddress,
        vestingSchedule.amount
      )
      await expect(
        vesting.connect(owner).addVestingSchedule(
          alice.address,
          vestingSchedule.amount,
          vestingSchedule.startTime,
          vestingSchedule.duration,
          vestingSchedule.cliff
        )
      ).to.be.revertedWithCustomError(
        vesting,
        'VestingCliffExceedsDuration'
      ).withArgs(
        vestingSchedule.cliff,
        vestingSchedule.duration
      )
    })
  })

  describe('Updating Vesting Schedules', function () {
    it('Allows Vesting Creators to update vesting schedules token amount', async function () {
      const {
        vesting,
        alice,
        owner,
        token
      } = await loadFixture(deployVestingContract)

      const vestingSchedule = {
        amount: ethers.parseUnits('1000', 18),
        startTime: Math.floor(Date.now() / 1000) + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 120 // 2 minutes from now
      }
      const additionalAmount = ethers.parseUnits('500', 18)
      const vestingAddress = await vesting.getAddress()
      await token.connect(owner).approve(
        vestingAddress,
        vestingSchedule.amount
      )
      await vesting.connect(owner).addVestingSchedule(
        alice.address,
        vestingSchedule.amount,
        vestingSchedule.startTime,
        vestingSchedule.duration,
        vestingSchedule.cliff
      )
      await token.connect(owner).approve(
        vestingAddress,
        additionalAmount
      )
      await vesting.connect(owner).addVestingSchedule(
        alice.address,
        additionalAmount,
        vestingSchedule.startTime + 60,
        vestingSchedule.duration + 60,
        vestingSchedule.cliff + 60
      )

      const {
        totalAmount,
        claimedAmount,
        vestingStart,
        vestingDuration,
        vestingCliff,
        initialized
      } = await vesting.vestingSchedules(alice.address)
      expect(totalAmount).to.equal(vestingSchedule.amount + additionalAmount)
      expect(claimedAmount).to.equal(0)
      expect(vestingStart).to.equal(vestingSchedule.startTime)
      expect(vestingDuration).to.equal(vestingSchedule.duration)
      expect(vestingCliff).to.equal(vestingSchedule.cliff)
      expect(initialized).to.be.true
      expect(
        await token.balanceOf(vestingAddress)
      ).to.equal(vestingSchedule.amount + additionalAmount)
    })

    it('Prevents anyone else from updating vesting schedules token amount', async function () {
      const {
        vesting,
        alice,
        owner,
        token,
        bob
      } = await loadFixture(deployVestingContract)

      const vestingSchedule = {
        amount: ethers.parseUnits('1000', 18),
        startTime: Math.floor(Date.now() / 1000) + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 120 // 2 minutes from now
      }
      const vestingAddress = await vesting.getAddress()
      await token.connect(owner).approve(
        vestingAddress,
        vestingSchedule.amount
      )
      await vesting.connect(owner).addVestingSchedule(
        alice.address,
        vestingSchedule.amount,
        vestingSchedule.startTime,
        vestingSchedule.duration,
        vestingSchedule.cliff
      )
      expect(
        vesting.connect(bob).addVestingSchedule(
          alice.address,
          vestingSchedule.amount,
          vestingSchedule.startTime,
          vestingSchedule.duration,
          vestingSchedule.cliff
        )
      ).to.be.revertedWithCustomError(
        vesting,
        'AccessControlUnauthorizedAccount'
      )
    })
  })

  describe('Claiming Vested Tokens', function () {
    it('Provides view function to check vested amount', async function () {
      const {
        vesting,
        alice,
        owner,
        token
      } = await loadFixture(deployVestingContract)
      const vestingSchedule = {
        amount: ethers.parseUnits('1000', 18),
        startTime: await time.latest() + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 120 // 2 minutes from now
      }
      const vestingAddress = await vesting.getAddress()
      await token.connect(owner).approve(
        vestingAddress,
        vestingSchedule.amount
      )
      await vesting.connect(owner).addVestingSchedule(
        alice.address,
        vestingSchedule.amount,
        vestingSchedule.startTime,
        vestingSchedule.duration,
        vestingSchedule.cliff
      )

      const [
        vestedAmount1,
        claimableAmount1
      ] = await vesting.getVestedAndClaimableTokens(alice.address)
      expect(vestedAmount1).to.equal(0)
      expect(claimableAmount1).to.equal(0)

      // Simulate time passing past startTime (+60) but before cliff (+120)
      await time.increaseTo(vestingSchedule.startTime + 30)
      const [
        vestedAmount2,
        claimableAmount2
      ] = await vesting.getVestedAndClaimableTokens(alice.address)
      expect(vestedAmount2).to.equal(0)
      expect(claimableAmount2).to.equal(0)

      // Simulate time passing past cliff (+120) but before end (+3600)
      await time.increaseTo(vestingSchedule.startTime + 180)
      const [
        vestedAmount3,
        claimableAmount3
      ] = await vesting.getVestedAndClaimableTokens(alice.address)
      expect(vestedAmount3).to.equal(ethers.parseUnits('50', 18))
      expect(claimableAmount3).to.equal(ethers.parseUnits('50', 18))

      // Simulate time passing past end (+3600)
      await time.increaseTo(vestingSchedule.startTime + 4000)
      const [
        vestedAmount4,
        claimableAmount4
      ] = await vesting.getVestedAndClaimableTokens(alice.address)
      expect(vestedAmount4).to.equal(ethers.parseUnits('1000', 18))
      expect(claimableAmount4).to.equal(ethers.parseUnits('1000', 18))
    })

    it('Updates view after claiming', async function () {
      const {
        vesting,
        alice,
        owner,
        token
      } = await loadFixture(deployVestingContract)
      const vestingSchedule = {
        amount: ethers.parseUnits('1000', 18),
        startTime: await time.latest() + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 120 // 2 minutes from now
      }
      const vestingAddress = await vesting.getAddress()
      await token.connect(owner).approve(
        vestingAddress,
        vestingSchedule.amount
      )
      await vesting.connect(owner).addVestingSchedule(
        alice.address,
        vestingSchedule.amount,
        vestingSchedule.startTime,
        vestingSchedule.duration,
        vestingSchedule.cliff
      )

      await time.setNextBlockTimestamp(vestingSchedule.startTime + 180)
      await expect(
        vesting.connect(alice).claimVestedTokens()
      ).to.emit(vesting, 'TokensClaimed').withArgs(
        alice.address,
        ethers.parseUnits('50', 18)
      )
      const [
        vestedAmount1,
        claimableAmount1
      ] = await vesting.getVestedAndClaimableTokens(alice.address)
      expect(vestedAmount1).to.equal(ethers.parseUnits('50', 18))
      expect(claimableAmount1).to.equal(ethers.parseUnits('0', 18))

      await time.setNextBlockTimestamp(vestingSchedule.startTime + 4000)
      await expect(
        vesting.connect(alice).claimVestedTokens()
      ).to.emit(vesting, 'TokensClaimed').withArgs(
        alice.address,
        ethers.parseUnits('950', 18)
      ).and.to.emit(vesting, 'VestingScheduleClosed').withArgs(
        alice.address,
        ethers.parseUnits('1000', 18),
        vestingSchedule.startTime,
        vestingSchedule.duration,
        vestingSchedule.cliff
      )
      const [
        vestedAmount2,
        claimableAmount2
      ] = await vesting.getVestedAndClaimableTokens(alice.address)
      expect(vestedAmount2).to.equal(ethers.parseUnits('0', 18))
      expect(claimableAmount2).to.equal(ethers.parseUnits('0', 18))
    })

    it('Prevents claiming before vesting start time', async function () {
      const {
        vesting,
        alice,
        owner,
        token
      } = await loadFixture(deployVestingContract)

      const vestingSchedule = {
        amount: ethers.parseUnits('1000', 18),
        startTime: await time.latest() + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 120 // 2 minutes from now
      }
      const vestingAddress = await vesting.getAddress()
      await token.connect(owner).approve(
        vestingAddress,
        vestingSchedule.amount
      )
      await vesting.connect(owner).addVestingSchedule(
        alice.address,
        vestingSchedule.amount,
        vestingSchedule.startTime,
        vestingSchedule.duration,
        vestingSchedule.cliff
      )

      await expect(
        vesting.connect(alice).claimVestedTokens()
      ).to.be.revertedWithCustomError(
        vesting,
        'VestingNoTokensToClaim'
      )
    })

    it('Prevents claiming before vesting cliff time', async function () {
      const {
        vesting,
        alice,
        owner,
        token
      } = await loadFixture(deployVestingContract)

      const vestingSchedule = {
        amount: ethers.parseUnits('1000', 18),
        startTime: await time.latest() + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 120 // 2 minutes from now
      }
      const vestingAddress = await vesting.getAddress()
      await token.connect(owner).approve(
        vestingAddress,
        vestingSchedule.amount
      )
      await vesting.connect(owner).addVestingSchedule(
        alice.address,
        vestingSchedule.amount,
        vestingSchedule.startTime,
        vestingSchedule.duration,
        vestingSchedule.cliff
      )

      await time.increaseTo(vestingSchedule.startTime + 90)
      await expect(
        vesting.connect(alice).claimVestedTokens()
      ).to.be.revertedWithCustomError(
        vesting,
        'VestingNoTokensToClaim'
      )
    })

    it('Prevents claiming when no vested tokens', async function () {
      const {
        vesting,
        alice
      } = await loadFixture(deployVestingContract)
      await expect(
        vesting.connect(alice).claimVestedTokens()
      ).to.be.revertedWithCustomError(
        vesting,
        'VestingNoSchedule'
      )
    })

    it('Allows claiming all tokens after vesting end time', async function () {
      const {
        vesting,
        alice,
        owner,
        token
      } = await loadFixture(deployVestingContract)

      const vestingSchedule = {
        amount: ethers.parseUnits('1000', 18),
        startTime: await time.latest() + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 120 // 2 minutes from now
      }
      const vestingAddress = await vesting.getAddress()
      await token.connect(owner).approve(
        vestingAddress,
        vestingSchedule.amount
      )
      await vesting.connect(owner).addVestingSchedule(
        alice.address,
        vestingSchedule.amount,
        vestingSchedule.startTime,
        vestingSchedule.duration,
        vestingSchedule.cliff
      )

      await time.setNextBlockTimestamp(vestingSchedule.startTime + 4000)
      await expect(
        vesting.connect(alice).claimVestedTokens()
      ).to.emit(vesting, 'TokensClaimed').withArgs(
        alice.address,
        vestingSchedule.amount
      )
      expect(
        await token.balanceOf(alice.address)
      ).to.equal(vestingSchedule.amount)
      expect(
        await token.balanceOf(vestingAddress)
      ).to.equal(0)
    })

    it('Allows anyone to claim their partially vested tokens', async function () {
      const {
        vesting,
        alice,
        owner,
        token
      } = await loadFixture(deployVestingContract)

      const vestingSchedule = {
        amount: ethers.parseUnits('1000', 18),
        startTime: await time.latest() + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 120 // 2 minutes from now
      }
      const vestingAddress = await vesting.getAddress()
      await token.connect(owner).approve(
        vestingAddress,
        vestingSchedule.amount
      )
      await vesting.connect(owner).addVestingSchedule(
        alice.address,
        vestingSchedule.amount,
        vestingSchedule.startTime,
        vestingSchedule.duration,
        vestingSchedule.cliff
      )

      await time.setNextBlockTimestamp(vestingSchedule.startTime + 180)
      await expect(
        vesting.connect(alice).claimVestedTokens()
      ).to.emit(vesting, 'TokensClaimed').withArgs(
        alice.address,
        ethers.parseUnits('50', 18)
      )
      expect(
        await token.balanceOf(alice.address)
      ).to.equal(ethers.parseUnits('50', 18))
      expect(
        await token.balanceOf(vestingAddress)
      ).to.equal(ethers.parseUnits('950', 18))
    })

    it('Handles claiming after more tokens were vested', async function () {
      const {
        vesting,
        alice,
        owner,
        token
      } = await loadFixture(deployVestingContract)

      const vestingSchedule = {
        amount: ethers.parseUnits('1000', 18),
        startTime: await time.latest() + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 120 // 2 minutes from now
      }
      const vestingAddress = await vesting.getAddress()
      await token.connect(owner).approve(
        vestingAddress,
        vestingSchedule.amount * 2n
      )
      await vesting.connect(owner).addVestingSchedule(
        alice.address,
        vestingSchedule.amount,
        vestingSchedule.startTime,
        vestingSchedule.duration,
        vestingSchedule.cliff
      )
      await expect(
        vesting.connect(owner).addVestingSchedule(
          alice.address,
          vestingSchedule.amount,
          vestingSchedule.startTime,
          vestingSchedule.duration,
          vestingSchedule.cliff
        )
      ).to.emit(vesting, 'VestingScheduleCreated').withArgs(
        alice.address,
        vestingSchedule.amount,
        vestingSchedule.startTime,
        vestingSchedule.duration,
        vestingSchedule.cliff
      )

      await time.setNextBlockTimestamp(vestingSchedule.startTime + 180)
      await expect(
        vesting.connect(alice).claimVestedTokens()
      ).to.emit(vesting, 'TokensClaimed').withArgs(
        alice.address,
        ethers.parseUnits('100', 18)
      )
      expect(
        await token.balanceOf(alice.address)
      ).to.equal(ethers.parseUnits('100', 18))
      expect(
        await token.balanceOf(vestingAddress)
      ).to.equal(ethers.parseUnits('1900', 18))
    })

    it('Allows new vesting schedules after previous closed', async function () {
      const {
        vesting,
        alice,
        owner,
        token
      } = await loadFixture(deployVestingContract)

      const vestingSchedule = {
        amount: ethers.parseUnits('1000', 18),
        startTime: await time.latest() + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 120 // 2 minutes from now
      }
      const vestingAddress = await vesting.getAddress()
      await token.connect(owner).approve(
        vestingAddress,
        vestingSchedule.amount
      )
      await vesting.connect(owner).addVestingSchedule(
        alice.address,
        vestingSchedule.amount,
        vestingSchedule.startTime,
        vestingSchedule.duration,
        vestingSchedule.cliff
      )

      await time.setNextBlockTimestamp(vestingSchedule.startTime + 4000)
      await expect(
        vesting.connect(alice).claimVestedTokens()
      ).to.emit(vesting, 'TokensClaimed').withArgs(
        alice.address,
        ethers.parseUnits('1000', 18)
      ).and.to.emit(vesting, 'VestingScheduleClosed').withArgs(
        alice.address,
        ethers.parseUnits('1000', 18),
        vestingSchedule.startTime,
        vestingSchedule.duration,
        vestingSchedule.cliff
      )

      const newVestingSchedule = {
        amount: ethers.parseUnits('500', 18),
        startTime: await time.latest() + 60, // 1 minute from now
        duration: 3600, // 1 hour
        cliff: 120 // 2 minutes from now
      }
      await token.connect(owner).approve(
        vestingAddress,
        newVestingSchedule.amount
      )
      await vesting.connect(owner).addVestingSchedule(
        alice.address,
        newVestingSchedule.amount,
        newVestingSchedule.startTime,
        newVestingSchedule.duration,
        newVestingSchedule.cliff
      )

      const {
        totalAmount,
        claimedAmount,
        vestingStart,
        vestingDuration,
        vestingCliff,
        initialized
      } = await vesting.vestingSchedules(alice.address)
      expect(totalAmount).to.equal(newVestingSchedule.amount)
      expect(claimedAmount).to.equal(0)
      expect(vestingStart).to.equal(newVestingSchedule.startTime)
      expect(vestingDuration).to.equal(newVestingSchedule.duration)
      expect(vestingCliff).to.equal(newVestingSchedule.cliff)
      expect(initialized).to.be.true
      expect(
        await token.balanceOf(vestingAddress)
      ).to.equal(newVestingSchedule.amount)
    })
  })
})
