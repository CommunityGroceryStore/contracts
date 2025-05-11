import { defineConfig } from '@wagmi/cli'
import { hardhat } from '@wagmi/cli/plugins'

export default defineConfig({
  out: 'artifacts/wagmi-generated.ts',
  contracts: [],
  plugins: [ hardhat({ project: '.' }) ]
})
