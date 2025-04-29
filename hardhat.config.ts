import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  ignition: {
    strategyConfig: {
      create2: {
        salt: '0xdead00000000000000000000000000000000000000000000000000000000dead'
      }
    }
  }
}

export default config
