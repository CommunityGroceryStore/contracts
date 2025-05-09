// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
  AccessControlEnumerable
} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import {
  IAccessControlEnumerable
} from "@openzeppelin/contracts/access/extensions/IAccessControlEnumerable.sol";

interface IVesting is IAccessControlEnumerable {
  function addVestingSchedule(
    address _beneficiary,
    uint256 _amount,
    uint256 _vestingStart,
    uint256 _vestingDuration,
    uint256 _vestingCliff
  ) external returns (bool);
}

contract CGSTokenPresale is AccessControlEnumerable {
  bytes32 public constant PRESALE_ADMIN_ROLE = keccak256("PRESALE_ADMIN_ROLE");
  bytes32 public constant VESTING_ADMIN_ROLE = keccak256("VESTING_ADMIN_ROLE");
  uint256 public constant MINIMUM_PRESALE_PURCHASE = 1e5; // $0.01 USDT/USDC

  bool public isPresalePaused = true;
  address public treasuryAddress;
  address public tokenAddress;
  address public vestingContractAddress;
  IERC20 public presaleToken;
  address public presaleTokenAddress;
  IVesting public vestingContract;
  uint256 public presaleTokensSold;
  struct PaymentToken {
    address paymentTokenAddress;
    // Rate is in terms of atomic payment tokens per whole presale token
    // e.g. 40_000 means $0.04 USDT per 1 presale token
    uint256 paymentTokenRate;
  }
  mapping(address => PaymentToken) public paymentTokens;

  struct VestingSchedule {
    uint256 vestingDuration; // Presale overall vesting duration in seconds
    uint256 vestingCliff; // Presale overall cliff duration in seconds
  }
  VestingSchedule public vestingSchedule;

  event PresalePaused();
  event PresaleUnpaused();
  event TreasuryAddressSet(address treasuryAddress);
  event VestingContractAddressSet(address vestingContractAddress);
  event PaymentTokenAdded(address token, uint256 rate);
  event PaymentTokenRemoved(address token);
  event TokensPurchased(
    address purchaser,
    uint256 _tokenAmount,
    address _paymentToken,
    uint256 paymentAmount,
    uint256 paymentTokenRate
  );

  error VestingCliffMustBeLessThanOrEqualToDuration();

  constructor(
    address newOwner,
    address _tokenAddress,
    uint256 _initialVestingDuration,
    uint256 _initialVestingCliff
  ) payable {
    _grantRole(DEFAULT_ADMIN_ROLE, newOwner);
    _grantRole(PRESALE_ADMIN_ROLE, newOwner);

    tokenAddress = _tokenAddress;
    presaleToken = IERC20(_tokenAddress);
    presaleTokenAddress = _tokenAddress;
    treasuryAddress = newOwner;
    vestingSchedule.vestingDuration = _initialVestingDuration;
    vestingSchedule.vestingCliff = _initialVestingCliff;
  }

  function setVestingScheduleParameters(
    uint256 _vestingDuration,
    uint256 _vestingCliff
  ) public onlyRole(PRESALE_ADMIN_ROLE) {
    require(
      _vestingCliff <= _vestingDuration,
      VestingCliffMustBeLessThanOrEqualToDuration()
    );
    
    vestingSchedule.vestingDuration = _vestingDuration;
    vestingSchedule.vestingCliff = _vestingCliff;
  }

  function withdrawERC20(address _token) external onlyRole(PRESALE_ADMIN_ROLE) {
    IERC20 token = IERC20(_token);
    uint256 balance = token.balanceOf(address(this));
    require(balance > 0, "No tokens to withdraw");
    
    bool success = token.transfer(treasuryAddress, balance);
    require(success, "ERC20 withdrawal failed");
  }

  function pausePresale() public onlyRole(PRESALE_ADMIN_ROLE) {
    isPresalePaused = true;
    emit PresalePaused();
  }

  function unpausePresale() public onlyRole(PRESALE_ADMIN_ROLE) {
    require(
      vestingContractAddress != address(0),
      "Vesting contract address not set"
    );
    require(
      vestingContract.hasRole(VESTING_ADMIN_ROLE, address(this)),
      "Presale contract must have VESTING_ADMIN_ROLE in vesting contract"
    );

    isPresalePaused = false;
    emit PresaleUnpaused();
  }

  function setTreasuryAddress(
    address newTreasuryAddress
  ) public onlyRole(PRESALE_ADMIN_ROLE) {
    treasuryAddress = newTreasuryAddress;
    emit TreasuryAddressSet(newTreasuryAddress);
  }

  function setVestingContractAddress(
    address newVestingContractAddress
  ) public onlyRole(PRESALE_ADMIN_ROLE) {
    vestingContractAddress = newVestingContractAddress;
    vestingContract = IVesting(newVestingContractAddress);
    emit VestingContractAddressSet(newVestingContractAddress);
  }

  function addPaymentToken(
    address _paymentTokenAddress,
    uint256 _rate
  ) public onlyRole(PRESALE_ADMIN_ROLE) {    
    paymentTokens[_paymentTokenAddress] = PaymentToken({
      paymentTokenAddress: _paymentTokenAddress,
      paymentTokenRate: _rate
    });
  }

  function removePaymentToken(
    address _token
  ) public onlyRole(PRESALE_ADMIN_ROLE) {    
    delete paymentTokens[_token];
  }

  function buy(
    uint256 _paymentTokenAtomicAmount,
    address _paymentToken
  ) external {
    require(!isPresalePaused, "Presale is paused");
    require(
      paymentTokens[_paymentToken].paymentTokenAddress != address(0),
      "Invalid payment token"
    );
    require(
      _paymentTokenAtomicAmount >= MINIMUM_PRESALE_PURCHASE,
      "Invalid payment amount"
    );
    
    IERC20 paymentToken = IERC20(
      paymentTokens[_paymentToken].paymentTokenAddress
    );
    uint256 rate = paymentTokens[_paymentToken].paymentTokenRate;

    uint256 presaleTokenAmount = (_paymentTokenAtomicAmount / rate) * 1e18;
    
    // Check if enough tokens are available
    require(
      presaleToken.balanceOf(address(this)) >= presaleTokenAmount,
      "Insufficient tokens in contract"
    );
    
    // Transfer payment from buyer to treasury
    require(
      paymentToken.transferFrom(
        msg.sender,
        treasuryAddress,
        _paymentTokenAtomicAmount
      ),
      "Payment transfer failed"
    );

    // Create vesting schedule in vesting contract
    require(
      presaleToken.approve(vestingContractAddress, presaleTokenAmount),
      "Vesting schedule creation token approval failed"
    );
    require(
      vestingContract.addVestingSchedule(
        msg.sender,
        presaleTokenAmount,
        block.timestamp,
        vestingSchedule.vestingDuration,
        vestingSchedule.vestingCliff
      ),
      "Vesting schedule creation failed"
    );
    
    presaleTokensSold += presaleTokenAmount;
    emit TokensPurchased(
      msg.sender,
      presaleTokenAmount,
      _paymentToken,
      _paymentTokenAtomicAmount,
      rate
    );
  }
}
