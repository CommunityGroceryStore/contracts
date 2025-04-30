import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'

import { deployPresaleContract } from './setup'

describe('Presale - Deployment', function () {
  // it('Should deploy', async function () {
  //   const {
  //     usdt,
  //     usdc,
  //     token,
  //     presale
  //   } = await loadFixture(deployPresaleContract)

  //   expect(await usdt.getAddress()).to.be.properAddress
  //   expect(await usdc.getAddress()).to.be.properAddress
  //   expect(await token.getAddress()).to.be.properAddress
  //   expect(await presale.getAddress()).to.be.properAddress
  // })

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

    const defaultAdmins = await presale.getRoleMembers(await presale.DEFAULT_ADMIN_ROLE())
    const presaleAdmins = await presale.getRoleMembers(await presale.PRESALE_ADMIN_ROLE())

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
})
