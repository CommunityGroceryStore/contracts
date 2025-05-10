import { ethers } from 'hardhat'

const to = process.env.TO || 'no-address'
const value = ethers.parseEther(process.env.VALUE || '0')
if (!ethers.isAddress(to)) {
  console.error(
    'Invalid TO address provided. Please provide a valid Ethereum address.'
  )
  process.exit(1)
}
if (!value || value <= 0) {
  console.error(
    'Invalid VALUE amount provided. Please provide a positive amount.'
  )
  process.exit(1)
}

export async function sendEthLocalhost() {
  const [ deployer ] = await ethers.getSigners()

  console.log('Deployer address:', deployer.address)
  console.log('Recipient address:', to)
  console.log('Amount ETH to send:', value.toString())
  console.log('Sending ETH...')
  const tx = await deployer.sendTransaction({ to, value })
  console.log(`Transaction hash: ${tx.hash}`)
  const receipt = await tx.wait()
  if (receipt) {
    console.log('Transaction mined in block:', receipt.blockHash)
  } else {
    console.error('Transaction receipt not found.')
  }

  const balance = await ethers.provider.getBalance(to)
  console.log('Recipient balance:', ethers.formatEther(balance))
}

sendEthLocalhost().catch(err => {
  console.error(err)
  process.exit(1)
})
