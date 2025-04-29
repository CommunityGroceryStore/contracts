import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'

import { deployTokenContract } from './setup'

describe('Token - ACL', function () {
  describe('Administration', function () {
    it('Allows owner to add Token Admins')
    it('Prevents non-owners from adding Token Admins')
    it('Allows owner to remove Token Admins')
    it('Prevents non-owners from removing Token Admins')
  })
})
