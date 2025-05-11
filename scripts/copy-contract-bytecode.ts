import { writeFileSync } from 'fs'
import CGSToken from '../artifacts/contracts/Token.sol/CGSToken.json'
import CGSVesting from '../artifacts/contracts/Vesting.sol/CGSVesting.json'
import CGSTokenPresale from '../artifacts/contracts/Presale.sol/CGSTokenPresale.json'
import MockStablecoin from '../artifacts/contracts/MockStablecoin.sol/MockStablecoin.json'

const OUTPATH = './artifacts/contract-bytecode.ts'

let out = `// This file is auto-generated. Do not edit manually.\n`
out += `export const CGSTokenBytecode = \`${CGSToken.bytecode}\`\n`
out += `export const CGSVestingBytecode = \`${CGSVesting.bytecode}\`\n`
out += `export const CGSTokenPresaleBytecode = \`${CGSTokenPresale.bytecode}\`\n`
out += `export const MockStablecoinBytecode = \`${MockStablecoin.bytecode}\`\n`

try {
  writeFileSync(OUTPATH, out)
  console.log(`Contracts bytecode written to ${OUTPATH}`)
} catch (err) {
  console.error('Error writing bytecode to file:', err)
  process.exit(1)
}
