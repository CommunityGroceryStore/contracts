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
  },
  networks: {
    localhost: { chainId: 539, url: 'http://localhost:7545' },
    hardhat: { chainId: 539 } // NB: Fix for brave wallet localhost network
  }
}

export default config
