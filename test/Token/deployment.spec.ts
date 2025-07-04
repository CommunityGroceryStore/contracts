import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'

import { deployTokenContract } from './setup'

describe('Token - Deployment', function () {
  it('Should mint total supply to owner', async function () {
    const {
      token,
      owner,
      TOTAL_SUPPLY_ATOMIC
    } = await loadFixture(deployTokenContract)

    expect(await token.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY_ATOMIC)
  })

  it('Should grant DEFAULT_ADMIN_ROLE to owner and TOKEN_ADMIN_ROLE to deployer & owner', async function () {
    const {
      token,
      owner,
      deployer
    } = await loadFixture(deployTokenContract)

    const defaultAdmins = await token.getRoleMembers(
      await token.DEFAULT_ADMIN_ROLE()
    )
    const tokenAdmins = await token.getRoleMembers(
      await token.TOKEN_ADMIN_ROLE()
    )

    expect(defaultAdmins).to.deep.equal([ owner.address ])
    expect(tokenAdmins).to.deep.equal([ owner.address, deployer.address ])
  })

  it('Should deploy with decimals set to 18', async function () {
    const {
      token
    } = await loadFixture(deployTokenContract)

    expect(await token.decimals()).to.equal(18)
  })

  it('Should deploy with total supply of whole tokens of 1 billion (* 1e18)', async function () {
    const {
      token,
      TOTAL_SUPPLY
    } = await loadFixture(deployTokenContract)

    const totalSupplyAtomic = BigInt(TOTAL_SUPPLY) * BigInt(1e18)

    expect(await token.totalSupply()).to.equal(totalSupplyAtomic)
  })

  it('Deploys with owner as treasury address', async function () {
    const {
      token,
      owner
    } = await loadFixture(deployTokenContract)

    expect(await token.treasuryAddress()).to.equal(owner.address)
  })
})
