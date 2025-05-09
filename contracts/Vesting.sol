// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {
  AccessControlEnumerable
} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CGSVesting is AccessControlEnumerable {
  bytes32 public constant VESTING_ADMIN_ROLE = keccak256("VESTING_ADMIN_ROLE");

  IERC20 public vestingToken;
  address public vestingTokenAddress;
  address public treasuryAddress;

  struct VestingSchedule {
    uint256 totalAmount; // Total tokens allocated
    uint256 claimedAmount; // Tokens already claimed
    uint256 vestingStart; // Individual vesting start timestamp
    uint256 vestingDuration; // Individual vesting duration in seconds
    uint256 vestingCliff; // Individual cliff duration in seconds
    bool initialized; // Whether the schedule is set
  }
  mapping(address => VestingSchedule) public vestingSchedules;

  event TreasuryAddressSet(address treasuryAddress);
  event VestingScheduleCreated(
    address indexed beneficiary,
    uint256 amount,
    uint256 vestingStart,
    uint256 vestingDuration,
    uint256 vestingCliff
  );
  event TokensClaimed(address indexed beneficiary, uint256 amount);
  event VestingScheduleClosed(
    address indexed beneficiary,
    uint256 totalAmount,
    uint256 vestingStart,
    uint256 vestingDuration,
    uint256 vestingCliff
  );

  error VestingInvalidAmount();
  error VestingInvalidStartTime();
  error VestingTokenTransferFailed();
  error VestingNoSchedule();
  error VestingNoTokensToClaim();

  constructor(address newOwner, address tokenAddress) {
    _grantRole(DEFAULT_ADMIN_ROLE, newOwner);
    _grantRole(VESTING_ADMIN_ROLE, newOwner);
    vestingToken = IERC20(tokenAddress);
    vestingTokenAddress = tokenAddress;
    treasuryAddress = newOwner;
  }

  function withdrawERC20(address _token) external onlyRole(VESTING_ADMIN_ROLE) {
    IERC20 token = IERC20(_token);
    uint256 balance = token.balanceOf(address(this));
    require(balance > 0, "No tokens to withdraw");
    
    bool success = token.transfer(treasuryAddress, balance);
    require(success, "ERC20 withdrawal failed");
  }

  function getTreasuryAddress() public view returns (address) {
    return treasuryAddress;
  }

  function setTreasuryAddress(
    address newTreasuryAddress
  ) public onlyRole(VESTING_ADMIN_ROLE) {
    require(newTreasuryAddress != address(0), "Invalid treasury address");
    require(newTreasuryAddress != address(0xdead), "Invalid treasury address");
    treasuryAddress = newTreasuryAddress;
    emit TreasuryAddressSet(newTreasuryAddress);
  }

  function addVestingSchedule(
    address _beneficiary,
    uint256 _amount,
    uint256 _vestingStart,
    uint256 _vestingDuration,
    uint256 _vestingCliff
  ) external onlyRole(VESTING_ADMIN_ROLE) returns (bool) {
    require(_beneficiary != address(0), "Invalid beneficiary address");
    require(_amount > 0, VestingInvalidAmount());
    require(_vestingCliff <= _vestingDuration, "Cliff cannot exceed duration");
    require(_vestingStart >= block.timestamp, VestingInvalidStartTime());
    require(
      vestingToken.transferFrom(
        msg.sender,
        address(this),
        _amount
      ),
      VestingTokenTransferFailed()
    );

    VestingSchedule storage schedule = vestingSchedules[_beneficiary];
    if (!schedule.initialized) {
      vestingSchedules[_beneficiary] = VestingSchedule({
        totalAmount: _amount,
        claimedAmount: 0,
        vestingStart: _vestingStart,
        vestingDuration: _vestingDuration,
        vestingCliff: _vestingCliff,
        initialized: true
      });
    } else {
      schedule.totalAmount = schedule.totalAmount + _amount;
    }

    emit VestingScheduleCreated(
      _beneficiary,
      _amount,
      _vestingStart,
      _vestingDuration,
      _vestingCliff
    );

    return true;
  }

  function getVestedAndClaimableTokens(
    address beneficiary
  ) public view returns (uint256 vestedAmount, uint256 claimableAmount) {
    VestingSchedule storage schedule = vestingSchedules[beneficiary];
    if (
      !schedule.initialized ||
      block.timestamp < (schedule.vestingStart + schedule.vestingCliff)
    ) {
      return (0, 0);
    }

    uint256 timeElapsed = block.timestamp - schedule.vestingStart;
    if (block.timestamp >= (schedule.vestingStart + schedule.vestingDuration)) {
      vestedAmount = schedule.totalAmount;
    } else {
      vestedAmount =
        (schedule.totalAmount * timeElapsed) / schedule.vestingDuration;
    }
    claimableAmount = vestedAmount - schedule.claimedAmount;

    return (vestedAmount, claimableAmount);
  }

  function claimVestedTokens() external {
    VestingSchedule storage schedule = vestingSchedules[msg.sender];
    require(schedule.initialized, VestingNoSchedule());
    ( , uint256 claimableAmount ) = getVestedAndClaimableTokens(msg.sender);
    require(claimableAmount > 0, VestingNoTokensToClaim());

    schedule.claimedAmount = schedule.claimedAmount + claimableAmount;
    require(
      schedule.claimedAmount <= schedule.totalAmount,
      "Claimed amount exceeds total amount"
    );
    require(
      vestingToken.transfer(msg.sender, claimableAmount),
      "Token transfer failed"
    );

    emit TokensClaimed(msg.sender, claimableAmount);

    if (schedule.claimedAmount >= schedule.totalAmount) {
      emit VestingScheduleClosed(
        msg.sender,
        schedule.totalAmount,
        schedule.vestingStart,
        schedule.vestingDuration,
        schedule.vestingCliff
      );
      delete vestingSchedules[msg.sender];
    }
  }
}
