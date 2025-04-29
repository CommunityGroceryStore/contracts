import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'

import { deployTokenContract } from './setup'
import { BURN_ADDRESS_0X0, BURN_ADDRESS_0XDEAD } from '../util'

describe('Token - Taxes', function () {
  describe('Deployment', function () {
    it('Deploys with owner exempt from taxes', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.isExemptFromTax(owner.address)).to.equal(true)
    })

    it('Deploys with self exempt from taxes', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)
      const tokenAddress = await token.getAddress()

      expect(await token.isExemptFromTax(tokenAddress)).to.equal(true)
    })

    it('Deploys with burn addresses exempt from taxes', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.isExemptFromTax(BURN_ADDRESS_0XDEAD)).to.equal(true)
      expect(await token.isExemptFromTax(BURN_ADDRESS_0X0)).to.equal(true)
    })

    it('Emits events for deployment tax exemptions', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)
      const tokenAddress = await token.getAddress()
      const filter = token.filters.TaxExemptionAdded
      const events = await token.queryFilter(filter)
      const taxExemptionAddedEvents = events.filter(
        event => event.eventName === 'TaxExemptionAdded'
      )

      expect(taxExemptionAddedEvents.length).to.equal(4)
      expect(
        taxExemptionAddedEvents.find(evt => evt.args[0] === owner.address)
      ).to.exist
      expect(
        taxExemptionAddedEvents.find(evt => evt.args[0] === tokenAddress)
      ).to.exist
      expect(
        taxExemptionAddedEvents.find(evt => evt.args[0] === BURN_ADDRESS_0XDEAD)
      ).to.exist
      expect(
        taxExemptionAddedEvents.find(evt => evt.args[0] === BURN_ADDRESS_0X0)
      ).to.exist
    })

    it('Deploys with taxes unpaused & enabled', async function () {
      const {
        token
      } = await loadFixture(deployTokenContract)

      expect(await token.isTaxPaused()).to.equal(false)
      expect(await token.isTaxPermanentlyDisabled()).to.equal(false)
    })

    it('Deploys with 1% buy & 1% sell tax rates', async function () {
      const {
        token
      } = await loadFixture(deployTokenContract)

      expect(await token.taxBuyRate()).to.equal(1_000)
      expect(await token.taxSellRate()).to.equal(1_000)
    })

    it('Deploys with owner as treasury address', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.getTreasuryAddress()).to.equal(owner.address)
    })
  })

  describe('Administration - Tax Exemptions', function () {
    it('Allows owner to add tax exemptions', async function () {
      const {
        token,
        owner,
        alice
      } = await loadFixture(deployTokenContract)
      expect(await token.isExemptFromTax(alice.address)).to.equal(false)

      await token.connect(owner).addTaxExemption(alice.address)
      expect(await token.isExemptFromTax(alice.address)).to.equal(true)

      const filter = token.filters.TaxExemptionAdded
      const events = await token.queryFilter(filter)
      const taxExemptionAddedEvents = events.filter(
        event => event.eventName === 'TaxExemptionAdded'
      )
      const addTaxExemptionEvent = taxExemptionAddedEvents.find(
        evt => evt.args[0] === alice.address
      )
      expect(addTaxExemptionEvent).to.exist
    })

    it('Allows Token Admins to add tax exemptions')
    it('Prevents non-owner from adding tax exemptions', async function () {
      const {
        token,
        alice
      } = await loadFixture(deployTokenContract)

      expect(await token.isExemptFromTax(alice.address)).to.equal(false)
      await expect(token.connect(alice).addTaxExemption(alice.address)).to.be
        .reverted
      expect(await token.isExemptFromTax(alice.address)).to.equal(false)
    })

    it('Allows owner to remove tax exemptions', async function () {
      const {
        token,
        owner,
        alice
      } = await loadFixture(deployTokenContract)

      expect(await token.isExemptFromTax(alice.address)).to.equal(false)
      await token.connect(owner).addTaxExemption(alice.address)
      expect(await token.isExemptFromTax(alice.address)).to.equal(true)

      await token.connect(owner).removeTaxExemption(alice.address)
      expect(await token.isExemptFromTax(alice.address)).to.equal(false)

      const filter = token.filters.TaxExemptionRemoved
      const events = await token.queryFilter(filter)
      const taxExemptionRemovedEvents = events.filter(
        event => event.eventName === 'TaxExemptionRemoved'
      )
      const removeTaxExemptionEvent = taxExemptionRemovedEvents.find(
        evt => evt.args[0] === alice.address
      )
      expect(removeTaxExemptionEvent).to.exist
    })
    it('Allows Token Admins to remove tax exemptions')
    it('Prevents non-owner from removing tax exemptions', async function () {
      const {
        token,
        owner,
        alice
      } = await loadFixture(deployTokenContract)

      await token.connect(owner).addTaxExemption(alice.address)
      expect(await token.isExemptFromTax(alice.address)).to.equal(true)

      await expect(
        token.connect(alice).removeTaxExemption(alice.address)
      ).to.be.reverted
      expect(await token.isExemptFromTax(alice.address)).to.equal(true)
    })
  })

  describe('Administration - Liquidity Providers', function () {
    it('Allows owner to add liquidity provider address', async function () {
      const {
        token,
        owner,
        liquidityProviderA
      } = await loadFixture(deployTokenContract)

      expect(await token.liquidityProviders(liquidityProviderA.address)).to.equal(false)
      await token.connect(owner).addLiquidityProvider(liquidityProviderA.address)
      expect(await token.liquidityProviders(liquidityProviderA.address)).to.equal(true)

      const filter = token.filters.LiquidityProviderAdded
      const events = await token.queryFilter(filter)
      const liquidityProviderAddedEvents = events.filter(
        event => event.eventName === 'LiquidityProviderAdded'
      )
      const addLiquidityProviderEvent = liquidityProviderAddedEvents.find(
        evt => evt.args[0] === liquidityProviderA.address
      )
      expect(addLiquidityProviderEvent).to.exist
    })

    it('Allows Token Admins to add liquidity provider address')
    it('Prevents non-owner from adding liquidity provider address', async function () {
      const {
        token,
        alice,
        liquidityProviderA
      } = await loadFixture(deployTokenContract)

      expect(await token.liquidityProviders(liquidityProviderA.address)).to.equal(false)
      await expect(
        token.connect(alice).addLiquidityProvider(liquidityProviderA.address)
      ).to.be.reverted
      expect(await token.liquidityProviders(liquidityProviderA.address)).to.equal(false)
    })

    it('Allows owner to remove liquidity provider address', async function () {
      const {
        token,
        owner,
        liquidityProviderA
      } = await loadFixture(deployTokenContract)

      expect(await token.liquidityProviders(liquidityProviderA.address)).to.equal(false)
      await token.connect(owner).addLiquidityProvider(liquidityProviderA.address)
      expect(await token.liquidityProviders(liquidityProviderA.address)).to.equal(true)

      await token.connect(owner).removeLiquidityProvider(liquidityProviderA.address)
      expect(await token.liquidityProviders(liquidityProviderA.address)).to.equal(false)

      const filter = token.filters.LiquidityProviderRemoved
      const events = await token.queryFilter(filter)
      const liquidityProviderRemovedEvents = events.filter(
        event => event.eventName === 'LiquidityProviderRemoved'
      )
      const removeLiquidityProviderEvent = liquidityProviderRemovedEvents.find(
        evt => evt.args[0] === liquidityProviderA.address
      )
      expect(removeLiquidityProviderEvent).to.exist
    })
    it('Allows Token Admins to remove liquidity provider address')
    it('Prevents non-owner from removing liquidity provider address', async function () {
      const {
        token,
        owner,
        alice,
        liquidityProviderA
      } = await loadFixture(deployTokenContract)

      await token.connect(owner).addLiquidityProvider(liquidityProviderA.address)
      expect(await token.liquidityProviders(liquidityProviderA.address)).to.equal(true)

      await expect(
        token.connect(alice).removeLiquidityProvider(liquidityProviderA.address)
      ).to.be.reverted
      expect(await token.liquidityProviders(liquidityProviderA.address)).to.equal(true)
    })
  })

  describe('Administration - Pausing & Disabling', function () {
    it('Allows owner to pause taxes', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.isTaxPaused()).to.equal(false)
      await token.connect(owner).pauseTax()
      expect(await token.isTaxPaused()).to.equal(true)
      const filter = token.filters.TaxPaused
      const events = await token.queryFilter(filter)
      const taxPausedEvents = events.filter(
        event => event.eventName === 'TaxPaused'
      )
      expect(taxPausedEvents.length).to.equal(1)
    })
    it('Allows Token Admins to pause taxes')
    it('Prevents non-owner from pausing taxes', async function () {
      const {
        token,
        alice
      } = await loadFixture(deployTokenContract)

      expect(await token.isTaxPaused()).to.equal(false)
      await expect(token.connect(alice).pauseTax()).to.be.reverted
      expect(await token.isTaxPaused()).to.equal(false)
    })

    it('Allows owner to unpause taxes', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.isTaxPaused()).to.equal(false)
      await token.connect(owner).pauseTax()
      expect(await token.isTaxPaused()).to.equal(true)

      await token.connect(owner).unpauseTax()
      expect(await token.isTaxPaused()).to.equal(false)
      const filter = token.filters.TaxUnpaused
      const events = await token.queryFilter(filter)
      const taxUnpausedEvents = events.filter(
        event => event.eventName === 'TaxUnpaused'
      )
      expect(taxUnpausedEvents.length).to.equal(1)
    })
    it('Allows Token Admins to unpause taxes')
    it('Prevents non-owner from unpausing taxes', async function () {
      const {
        token,
        owner,
        alice
      } = await loadFixture(deployTokenContract)

      expect(await token.isTaxPaused()).to.equal(false)
      await token.connect(owner).pauseTax()
      expect(await token.isTaxPaused()).to.equal(true)

      await expect(token.connect(alice).unpauseTax()).to.be.reverted
      expect(await token.isTaxPaused()).to.equal(true)
    })

    it('Allows owner to permanently disable taxes', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.isTaxPermanentlyDisabled()).to.equal(false)
      await token.connect(owner).permanentlyDisableTax()
      expect(await token.isTaxPermanentlyDisabled()).to.equal(true)
      const filter = token.filters.TaxPermanentlyDisabled
      const events = await token.queryFilter(filter)
      const taxPermanentlyDisabledEvents = events.filter(
        event => event.eventName === 'TaxPermanentlyDisabled'
      )
      expect(taxPermanentlyDisabledEvents.length).to.equal(1)
    })
    it('Allows Token Admins to permanently disable taxes')
    it('Prevents non-owner from permanently disabling taxes', async function () {
      const {
        token,
        alice
      } = await loadFixture(deployTokenContract)

      expect(await token.isTaxPermanentlyDisabled()).to.equal(false)
      await expect(
        token.connect(alice).permanentlyDisableTax()
      ).to.be.reverted
      expect(await token.isTaxPermanentlyDisabled()).to.equal(false)
    })
  })

  describe('Administration - Tax Rates', function () {
    it('Allows owner to set buy tax rate', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.taxBuyRate()).to.equal(1_000)
      await token.connect(owner).setBuyTaxRate(5_000)
      expect(await token.taxBuyRate()).to.equal(5_000)
      const filter = token.filters.TaxBuyRateSet
      const events = await token.queryFilter(filter)
      const taxBuyRateSetEvents = events.filter(
        event => event.eventName === 'TaxBuyRateSet'
      )
      const taxBuyRateSetEvent = taxBuyRateSetEvents.find(
        evt => evt.args[0].toString() === '5000'
      )
      expect(taxBuyRateSetEvent).to.exist
    })
    it('Allows Token Admins to set buy tax rate')
    it('Prevents non-owner from setting buy tax rate', async function () {
      const {
        token,
        alice
      } = await loadFixture(deployTokenContract)
      
      expect(await token.taxBuyRate()).to.equal(1_000)
      await expect(token.connect(alice).setBuyTaxRate(5_000)).to.be.reverted
      expect(await token.taxBuyRate()).to.equal(1_000)
    })
    it('Prevent buy tax rate from being set after taxes are permanently disabled', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.taxBuyRate()).to.equal(1_000)
      await token.connect(owner).permanentlyDisableTax()
      expect(await token.taxBuyRate()).to.equal(1_000)
      await expect(token.connect(owner).setBuyTaxRate(5_000))
        .to.be.revertedWith('Tax is permanently disabled')
      expect(await token.taxBuyRate()).to.equal(1_000)
    })

    it('Allows owner to set sell tax rate', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.taxSellRate()).to.equal(1_000)
      await token.connect(owner).setSellTaxRate(5_000)
      expect(await token.taxSellRate()).to.equal(5_000)
      const filter = token.filters.TaxSellRateSet
      const events = await token.queryFilter(filter)
      const taxSellRateSetEvents = events.filter(
        event => event.eventName === 'TaxSellRateSet'
      )
      const taxSellRateSetEvent = taxSellRateSetEvents.find(
        evt => evt.args[0].toString() === '5000'
      )
      expect(taxSellRateSetEvent).to.exist
    })
    it('Allows Token Admins to set sell tax rate')
    it('Prevents non-owner from setting sell tax rate', async function () {
      const {
        token,
        alice
      } = await loadFixture(deployTokenContract)

      expect(await token.taxSellRate()).to.equal(1_000)
      await expect(token.connect(alice).setSellTaxRate(5_000)).to.be.reverted
      expect(await token.taxSellRate()).to.equal(1_000)
    })
    it('Prevent sell tax rate from being set after taxes are permanently disabled', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.taxSellRate()).to.equal(1_000)
      await token.connect(owner).permanentlyDisableTax()
      expect(await token.taxSellRate()).to.equal(1_000)
      await expect(token.connect(owner).setSellTaxRate(5_000))
        .to.be.revertedWith('Tax is permanently disabled')
      expect(await token.taxSellRate()).to.equal(1_000)
    })
    it('Allows buy tax rate to be set to 0%', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.taxBuyRate()).to.equal(1_000)
      await token.connect(owner).setBuyTaxRate(0)
      expect(await token.taxBuyRate()).to.equal(0)
    })
    it('Prevents buy tax rate from being set to above 20%', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.taxBuyRate()).to.equal(1_000)
      await expect(token.connect(owner).setBuyTaxRate(21_000))
        .to.be.revertedWith('Tax rate cannot exceed MAX_TAX_RATE')
      expect(await token.taxBuyRate()).to.equal(1_000)
    })
    it('Allows sell tax rate to be set to 0%', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.taxSellRate()).to.equal(1_000)
      await token.connect(owner).setSellTaxRate(0)
      expect(await token.taxSellRate()).to.equal(0)
    })
    it('Prevents sell tax rate from being set to above 20%', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.taxSellRate()).to.equal(1_000)
      await expect(token.connect(owner).setSellTaxRate(21_000))
        .to.be.revertedWith('Tax rate cannot exceed MAX_TAX_RATE')
      expect(await token.taxSellRate()).to.equal(1_000)
    })
  })

  describe('Administration - Treasury', function () {
    it('Allows owner to set treasury address', async function () {
      const {
        token,
        owner,
        alice
      } = await loadFixture(deployTokenContract)

      expect(await token.getTreasuryAddress()).to.equal(owner.address)
      await token.connect(owner).setTreasuryAddress(alice.address)
      expect(await token.getTreasuryAddress()).to.equal(alice.address)

      const filter = token.filters.TreasuryAddressSet
      const events = await token.queryFilter(filter)
      const treasuryAddressSetEvents = events.filter(
        event => event.eventName === 'TreasuryAddressSet'
      )
      const treasuryAddressSetEvent = treasuryAddressSetEvents.find(
        evt => evt.args[0] === alice.address
      )
      expect(treasuryAddressSetEvent).to.exist
    })

    it('Allows Token Admins to set treasury address')

    it('Prevents non-owner from setting treasury address', async function () {
      const {
        token,
        alice,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.getTreasuryAddress()).to.equal(owner.address)
      await expect(token.connect(alice).setTreasuryAddress(alice.address))
        .to.be.reverted
      expect(await token.getTreasuryAddress()).to.equal(owner.address)
    })
    it('Prevents treasury address from being set to burn addresses', async function () {
      const {
        token,
        owner
      } = await loadFixture(deployTokenContract)

      expect(await token.getTreasuryAddress()).to.equal(owner.address)

      await expect(
        token.connect(owner).setTreasuryAddress(BURN_ADDRESS_0XDEAD)
      ).to.be.revertedWith('Invalid treasury address')
      expect(await token.getTreasuryAddress()).to.equal(owner.address)

      await expect(
        token.connect(owner).setTreasuryAddress(BURN_ADDRESS_0X0)
      ).to.be.revertedWith('Invalid treasury address')
      expect(await token.getTreasuryAddress()).to.equal(owner.address)
    })
  })

  describe('Enforcement', function () {
    it('Applies buy tax on buy transactions', async function () {
      const {
        token,
        owner,
        alice,
        liquidityProviderA,
        treasury
      } = await loadFixture(deployTokenContract)

      await token.connect(owner).setBuyTaxRate(3_000) // 3% buy tax
      await token.connect(owner).addLiquidityProvider(liquidityProviderA.address)
      await token.connect(owner).setTreasuryAddress(treasury.address)
      await token.connect(owner).transfer(liquidityProviderA.address, BigInt(1_000_000) * BigInt(1e18))

      await token.connect(liquidityProviderA).transfer(alice.address, BigInt(69_420) * BigInt(1e18))

      expect(await token.balanceOf(treasury.address)).to.equal(BigInt(20_826) * BigInt(1e17))
      expect(await token.balanceOf(alice.address)).to.equal(BigInt(673_374) * BigInt(1e17))
      expect(await token.balanceOf(liquidityProviderA.address)).to.equal(BigInt(1_000_000 - 69_420) * BigInt(1e18))
    })

    it('Applies sell tax on sell transactions', async function () {
      const {
        token,
        owner,
        alice,
        liquidityProviderA,
        treasury
      } = await loadFixture(deployTokenContract)

      await token.connect(owner).setSellTaxRate(3_000) // 3% sell tax
      await token.connect(owner).addLiquidityProvider(liquidityProviderA.address)
      await token.connect(owner).setTreasuryAddress(treasury.address)
      await token.connect(owner).transfer(alice.address, BigInt(1_000_000) * BigInt(1e18))

      await token.connect(alice).transfer(liquidityProviderA.address, BigInt(69_420) * BigInt(1e18))

      expect(await token.balanceOf(treasury.address)).to.equal(BigInt(20_826) * BigInt(1e17))
      expect(await token.balanceOf(alice.address)).to.equal(BigInt(1_000_000 - 69_420) * BigInt(1e18))
      expect(await token.balanceOf(liquidityProviderA.address)).to.equal(BigInt(673_374) * BigInt(1e17))
    })

    it('Does not apply buy tax on exempt addresses', async function () {
      const {
        token,
        owner,
        alice,
        liquidityProviderA,
        treasury
      } = await loadFixture(deployTokenContract)

      await token.connect(owner).setBuyTaxRate(3_000) // 3% buy tax
      await token.connect(owner).addLiquidityProvider(liquidityProviderA.address)
      await token.connect(owner).setTreasuryAddress(treasury.address)
      await token.connect(owner).addTaxExemption(alice.address)
      await token.connect(owner).transfer(liquidityProviderA.address, BigInt(1_000_000) * BigInt(1e18))

      await token.connect(liquidityProviderA).transfer(alice.address, BigInt(69_420) * BigInt(1e18))

      expect(await token.balanceOf(treasury.address)).to.equal(0)
      expect(await token.balanceOf(alice.address)).to.equal(BigInt(69_420) * BigInt(1e18))
      expect(await token.balanceOf(liquidityProviderA.address)).to.equal(
        BigInt(1_000_000 - 69_420) * BigInt(1e18)
      )
    })

    it('Does not apply sell tax on exempt addresses', async function () {
      const {
        token,
        owner,
        alice,
        liquidityProviderA,
        treasury
      } = await loadFixture(deployTokenContract)

      await token.connect(owner).setSellTaxRate(3_000) // 3% sell tax
      await token.connect(owner).addLiquidityProvider(liquidityProviderA.address)
      await token.connect(owner).setTreasuryAddress(treasury.address)
      await token.connect(owner).addTaxExemption(alice.address)
      await token.connect(owner).transfer(alice.address, BigInt(1_000_000) * BigInt(1e18))

      await token.connect(alice).transfer(liquidityProviderA.address, BigInt(69_420) * BigInt(1e18))

      expect(await token.balanceOf(treasury.address)).to.equal(0)
      expect(await token.balanceOf(alice.address)).to.equal(BigInt(1_000_000 - 69_420) * BigInt(1e18))
      expect(await token.balanceOf(liquidityProviderA.address)).to.equal(BigInt(69_420) * BigInt(1e18))
    })

    it('Does not apply tax on normal transfers', async function () {
      const {
        token,
        owner,
        alice,
        bob
      } = await loadFixture(deployTokenContract)

      await token.connect(owner).transfer(alice.address, 1_000)
      expect(await token.balanceOf(alice.address)).to.equal(1_000)
      await token.connect(alice).transfer(bob.address, 1_000)
      expect(await token.balanceOf(bob.address)).to.equal(1_000)
    })

    it('Does not apply tax if taxes are paused', async function () {
      const {
        token,
        owner,
        alice,
        liquidityProviderA,
        treasury
      } = await loadFixture(deployTokenContract)
      await token.connect(owner).setSellTaxRate(3_000) // 3% sell tax
      await token.connect(owner).addLiquidityProvider(liquidityProviderA.address)
      await token.connect(owner).setTreasuryAddress(treasury.address)
      await token.connect(owner).pauseTax()

      await token.connect(owner).transfer(alice.address, 1_000)
      await token.connect(alice).transfer(liquidityProviderA.address, 1_000)
      expect(await token.balanceOf(alice.address)).to.equal(0)
      expect(await token.balanceOf(liquidityProviderA.address)).to.equal(1_000)
      expect(await token.balanceOf(treasury.address)).to.equal(0)
    })

    it('Does not apply tax if taxes are permanently disabled', async function () {
      const {
        token,
        owner,
        alice,
        liquidityProviderA,
        treasury
      } = await loadFixture(deployTokenContract)
      await token.connect(owner).setSellTaxRate(3_000) // 3% sell tax
      await token.connect(owner).addLiquidityProvider(liquidityProviderA.address)
      await token.connect(owner).setTreasuryAddress(treasury.address)
      await token.connect(owner).permanentlyDisableTax()

      await token.connect(owner).transfer(alice.address, 1_000)
      await token.connect(alice).transfer(liquidityProviderA.address, 1_000)
      expect(await token.balanceOf(alice.address)).to.equal(0)
      expect(await token.balanceOf(liquidityProviderA.address)).to.equal(1_000)
      expect(await token.balanceOf(treasury.address)).to.equal(0)
    })
  })
})
