import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const CGSTokenModule = buildModule('CGSTokenModule', m => {
  const ownerAddress = m.getParameter('ownerAddress')
  const initialSupply = m.getParameter('initialSupply', BigInt(1_000_000_000) * BigInt(1e18))

  const token = m.contract('CGSToken', [ownerAddress, initialSupply])

  return { token }
})

export default CGSTokenModule
