import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import { ethers } from 'hardhat'

const CGSTokenModule = buildModule('CGSTokenModule', m => {
  const ownerAddress = m.getParameter('ownerAddress')
  const initialSupply = m.getParameter(
    'initialSupply',
    ethers.parseUnits('1000000000', 18)
  )
  const token = m.contract('CGSToken', [ ownerAddress, initialSupply ])

  return { token }
})

export default CGSTokenModule
