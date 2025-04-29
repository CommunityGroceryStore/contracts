import hre from 'hardhat'

export async function deployTokenContract() {
  const TOTAL_SUPPLY = 1_000_000_000
  const TOTAL_SUPPLY_ATOMIC = BigInt(TOTAL_SUPPLY) * BigInt(1e18)

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
  ] = await hre.ethers.getSigners()

  const Token = await hre.ethers.getContractFactory('CGSToken')
  const token = await Token.deploy(owner, TOTAL_SUPPLY_ATOMIC)

  return {
    token,
    TOTAL_SUPPLY,
    TOTAL_SUPPLY_ATOMIC,
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
