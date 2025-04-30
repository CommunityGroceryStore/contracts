import { ethers } from 'hardhat'

export const BURN_ADDRESS_0XDEAD = '0x000000000000000000000000000000000000dEaD'
export const BURN_ADDRESS_0X0 = '0x0000000000000000000000000000000000000000'
export async function getSigners() {
  // Contracts are deployed using the first signer/account by default
  const [
    deployer,
    owner,
    alice,
    bob,
    charls,
    liquidityProviderA,
    liquidityProviderB,
    treasury
  ] = await ethers.getSigners()

  return {
    deployer,
    owner,
    alice,
    bob,
    charls,
    liquidityProviderA,
    liquidityProviderB,
    treasury
  }
}

export function deployMockStablecoinContract(
  name: string,
  symbol: string,
  initialSupply: number
) {
  return async function () {
    const SIGNERS = await getSigners()

    const MockStablecoin = await ethers.getContractFactory('MockStablecoin')
    const mockStablecoin = await MockStablecoin.deploy(
      name,
      symbol,
      initialSupply
    )
  
    return {
      mockStablecoin,
      ...SIGNERS
    }
  }
}
