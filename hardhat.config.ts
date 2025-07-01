import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-verify'

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
    hardhat: { chainId: 539 }, // NB: Fix for brave wallet localhost network,
    mainnet: { chainId: 1, url: '' }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ""
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true
  }
}

export default config
