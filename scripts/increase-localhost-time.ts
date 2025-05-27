import { time } from '@nomicfoundation/hardhat-network-helpers'

export async function increaseLocalhostTime() {
  const timestamp = await time.latest()
  const increaseBySeconds = 3600
  const newTimestamp = timestamp + increaseBySeconds
  console.log(
    `Increasing localhost time by ${increaseBySeconds}s `
      + `from [${timestamp}] `
      + `${new Date(Number(timestamp) * 1000).toUTCString()} `
      + `to [${newTimestamp}] `
      + `${new Date(Number(newTimestamp) * 1000).toUTCString()}`
  )
  await time.increaseTo(newTimestamp)
  const resultTimestamp = await time.latest()
  console.log(
    `New localhost time is [${resultTimestamp}] `
      + `${new Date(Number(resultTimestamp) * 1000).toUTCString()}`
  )
}

increaseLocalhostTime().catch(err => {
  console.error(err)
  process.exit(1)
})
