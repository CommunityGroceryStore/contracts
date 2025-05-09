import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'

import { deployPresaleContract } from './setup'

describe('Presale - Deployment', function () {
  it('Deploys with presale paused', async function () {
    const {
      presale
    } = await loadFixture(deployPresaleContract)

    expect(await presale.isPresalePaused()).to.equal(true)
  })

  it('Grants DEFAULT_ADMIN_ROLE and PRESALE_ADMIN_ROLE to owner', async function () {
    const {
      presale,
      owner
    } = await loadFixture(deployPresaleContract)

    const defaultAdmins = await presale.getRoleMembers(
      await presale.DEFAULT_ADMIN_ROLE()
    )
    const presaleAdmins = await presale.getRoleMembers(
      await presale.PRESALE_ADMIN_ROLE()
    )

    expect(defaultAdmins).to.deep.equal([ owner.address ])
    expect(presaleAdmins).to.deep.equal([ owner.address ])
  })

  it('Deploys with owner as treasury address', async function () {
    const {
      presale,
      owner
    } = await loadFixture(deployPresaleContract)

    expect(await presale.treasuryAddress()).to.equal(owner.address)
  })

  it('Deploys with vesting schedule parameters set', async function () {
    const {
      presale,
      INITIAL_VESTING_DURATION,
      INITIAL_VESTING_CLIFF
    } = await loadFixture(deployPresaleContract)

    const vestingSchedule = await presale.vestingSchedule()
    expect(vestingSchedule.vestingDuration).to.equal(INITIAL_VESTING_DURATION)
    expect(vestingSchedule.vestingCliff).to.equal(INITIAL_VESTING_CLIFF)
  })
})
