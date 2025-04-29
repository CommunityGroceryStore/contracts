import { ethers } from 'hardhat'

const OWNER = process.env.CONTRACT_OWNER_ADDRESS
const SALT = process.env.SALT || 'my-salt-123'

async function deploy() {
  // Get the deployer account
  const [ deployer, hardhatOwner ] = await ethers.getSigners()
  const ownerAddress = OWNER || hardhatOwner.address
  const totalSupply = BigInt(1_000_000_000) * BigInt(1e18)
  const contractName = 'CGSToken'
  console.log('Deployer address:', deployer.address)
  console.log('Owner address:', ownerAddress)
  console.log('Total Supply:', totalSupply)

  // Deploy the FactoryDeployer contract
  const FactoryDeployer = await ethers.getContractFactory('FactoryDeployer')
  const factory = await FactoryDeployer.deploy()
  console.log('Factory deployed to:', await factory.getAddress())

  // Get the CGSToken contract factory and bytecode
  const CGSToken = await ethers.getContractFactory(contractName)
  const bytecode = CGSToken.bytecode
  const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(
    [ 'address', 'uint256' ],
    [ ownerAddress, totalSupply ]
  )
  const creationBytecode = ethers.concat([bytecode, constructorArgs])
  console.log('creationBytecode:', creationBytecode.substring(0, 20))

  // Choose a salt (32 bytes)
  console.log('OG Salt:', ethers.id('salt'))
  const salt = '0xdead00000000000000000000000000000000000000000000000000000000dead'//ethers.id(SALT)
  console.log('Salt:', salt)

  // Compute the deterministic address
  const initCodeHash = ethers.keccak256(creationBytecode)
  console.log('initCodeHash:', initCodeHash.substring(0, 20))
  const predictedAddress = ethers.getCreate2Address(
    deployer.address,
    salt,
    initCodeHash
  )
  console.log('Predicted address:', predictedAddress)

  const altDeployed = await CGSToken.deploy(ownerAddress, totalSupply)
  const altTxResponse = altDeployed.deploymentTransaction()
  const altTxReceipt = await altTxResponse?.wait()
  console.log('alt tx contract address:', altTxReceipt?.contractAddress)

  // Check if a contract already exists at the address
  const codeAtAddress = await ethers.provider.getCode(predictedAddress)
  if (codeAtAddress !== '0x') {
    console.error('Contract already exists at predicted address!')
    return
  }

  // // Prepare the CREATE2 deployment transaction
  // // We send a transaction to the deployer's own address with the creation bytecode
  // // and specify the salt in a way that triggers CREATE2 (handled by the EVM)
  // const data = ethers.concat([salt, creationBytecode])
  // console.log('data:', data.substring(0, 100))
  // const tx = {
  //   to: deployer.address, // Sending to self, but CREATE2 will deploy to the computed address
  //   data, // Salt + bytecode
  //   gasLimit: 1_000_000, // Adjust based on contract complexity
  // }

  // // Sign and send the transaction
  // const txResponse = await deployer.sendTransaction(tx)
  // const receipt = await txResponse.wait()
  // console.log('Transaction hash:', receipt?.hash)
  // console.log('contract address:', receipt?.contractAddress)

  // Deploy using the factory
  const tx = await factory.deploy(creationBytecode, salt, ownerAddress, totalSupply, { gasLimit: 1_500_000 })
  const receipt = await tx.wait();
  console.log("Transaction hash:", receipt?.hash);

  // Verify the deployment
  const deployedAddress = predictedAddress // CREATE2 ensures this is the address
  const deployedCode = await ethers.provider.getCode(deployedAddress)
  if (deployedCode === '0x') {
    console.error('Deployment failed: No code at predicted address!')
    return;
  }
  console.log('Deployed address:', deployedAddress)
  console.log('Address matches prediction:', deployedAddress === predictedAddress)

  // Interact with the deployed contract
  const token = await ethers.getContractAt(contractName, deployedAddress)
  const value = await token.balanceOf(ownerAddress)
  console.log('Owner balance:', value.toString())
}

deploy().catch(error => {
  console.error(error)
  process.exit(1)
})
