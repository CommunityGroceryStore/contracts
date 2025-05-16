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
  bytes32 public constant VESTING_CREATOR_ROLE = keccak256("VESTING_CREATOR_ROLE");
  uint256 public constant MINIMUM_PRESALE_PURCHASE = 1e4; // $0.01 USDT/USDC

  bool public isPresalePaused = true;
  address public treasuryAddress;
  address public tokenAddress;
  address public vestingContractAddress;
  IERC20 public presaleToken;
  IVesting public vestingContract;
  uint256 public presaleTokensSold;
  // Rate is in terms of atomic payment tokens per whole presale token
  // e.g. 40_000 means $0.04 USDT per 1 presale token
  mapping(address => uint256) public paymentTokenRates;

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
    uint256 tokenAmount,
    address paymentToken,
    uint256 paymentAmount,
    uint256 paymentTokenRate
  );
  event VestingScheduleParametersSet(
    uint256 vestingDuration,
    uint256 vestingCliff
  );

  error VestingCliffMustBeLessThanOrEqualToDuration();
  error VestingContractAddressNotSet();
  error PresaleContractDoesNotHaveVestingCreatorRoleinVestingContract();
  error InvalidTreasuryAddress();
  error PresaleIsNotPaused();
  error PresaleIsPaused();
  error InvalidPaymentToken(address invalidPaymentTokenAddress);
  error PaymentAmountLessThanMinimum(
    uint256 paymentAmount,
    uint256 minimumPaymentAmount
  );
  error AvailableTokensLessThanRequestedPurchaseAmount(
    uint256 availableTokens,
    uint256 requestedPurchaseAmount
  );
  error PaymentTokenTransferFailed(
    address buyer,
    address treasuryAddress,
    uint256 paymentTokenAtomicAmount
  );
  error VestingScheduleCreationTokenApprovalFailed(
    address buyer,
    uint256 presaleTokenAmount,
    address vestingContractAddress
  );
  error VestingScheduleCreationFailed(
    address buyer,
    uint256 presaleTokenAmount,
    uint256 startTime,
    uint256 vestingDuration,
    uint256 vestingCliff
  );
  error PresaleContractDoesNotHaveTokens();

  constructor(
    address newOwner,
    address _tokenAddress,
    uint256 initialVestingDuration,
    uint256 initialVestingCliff,
    address _vestingContractAddress
  ) {
    _grantRole(DEFAULT_ADMIN_ROLE, newOwner);
    _grantRole(PRESALE_ADMIN_ROLE, newOwner);
    _grantRole(PRESALE_ADMIN_ROLE, msg.sender);

    tokenAddress = _tokenAddress;
    presaleToken = IERC20(tokenAddress);
    treasuryAddress = newOwner;
    vestingSchedule.vestingDuration = initialVestingDuration;
    vestingSchedule.vestingCliff = initialVestingCliff;
    setVestingContractAddress(_vestingContractAddress);
  }

  function setVestingScheduleParameters(
    uint256 vestingDuration,
    uint256 vestingCliff
  ) public onlyRole(PRESALE_ADMIN_ROLE) {
    require(
      vestingCliff <= vestingDuration,
      VestingCliffMustBeLessThanOrEqualToDuration()
    );
    
    vestingSchedule.vestingDuration = vestingDuration;
    vestingSchedule.vestingCliff = vestingCliff;

    emit VestingScheduleParametersSet(
      vestingDuration,
      vestingCliff
    );
  }

  function withdrawERC20(
    address withdrawTokenAddress
  ) external onlyRole(PRESALE_ADMIN_ROLE) {
    IERC20 token = IERC20(withdrawTokenAddress);
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
      VestingContractAddressNotSet()
    );
        require(
      vestingContractAddress != address(0xdead),
      VestingContractAddressNotSet()
    );
    require(
      vestingContract.hasRole(VESTING_CREATOR_ROLE, address(this)),
      PresaleContractDoesNotHaveVestingCreatorRoleinVestingContract()
    );
    require(
      presaleToken.balanceOf(address(this)) > 0,
      PresaleContractDoesNotHaveTokens()
    );

    isPresalePaused = false;
    emit PresaleUnpaused();
  }

  function setTreasuryAddress(
    address newTreasuryAddress
  ) public onlyRole(PRESALE_ADMIN_ROLE) {
    require(newTreasuryAddress != address(0), InvalidTreasuryAddress());
    require(newTreasuryAddress != address(0xdead), InvalidTreasuryAddress());
    treasuryAddress = newTreasuryAddress;
    emit TreasuryAddressSet(newTreasuryAddress);
  }

  function setVestingContractAddress(
    address newVestingContractAddress
  ) public onlyRole(PRESALE_ADMIN_ROLE) {
    require(isPresalePaused, PresaleIsNotPaused());
    vestingContractAddress = newVestingContractAddress;
    vestingContract = IVesting(newVestingContractAddress);
    emit VestingContractAddressSet(newVestingContractAddress);
  }

  function addPaymentToken(
    address paymentTokenAddress,
    uint256 paymentTokenRate
  ) public onlyRole(PRESALE_ADMIN_ROLE) {    
    paymentTokenRates[paymentTokenAddress] = paymentTokenRate;
    emit PaymentTokenAdded(paymentTokenAddress, paymentTokenRate);
  }

  function removePaymentToken(
    address paymentTokenAddress
  ) public onlyRole(PRESALE_ADMIN_ROLE) {    
    delete paymentTokenRates[paymentTokenAddress];
    emit PaymentTokenRemoved(paymentTokenAddress);
  }

  function buy(
    uint256 paymentTokenAtomicAmount,
    address paymentTokenAddress
  ) external {
    require(!isPresalePaused, PresaleIsPaused());
    require(
      paymentTokenRates[paymentTokenAddress] > 0,
      InvalidPaymentToken(paymentTokenAddress)
    );
    require(
      paymentTokenAtomicAmount >= MINIMUM_PRESALE_PURCHASE,
      PaymentAmountLessThanMinimum(
        paymentTokenAtomicAmount,
        MINIMUM_PRESALE_PURCHASE
      )
    );
    
    IERC20 paymentToken = IERC20(paymentTokenAddress);
    uint256 rate = paymentTokenRates[paymentTokenAddress];

    uint256 presaleTokenAmount = (paymentTokenAtomicAmount / rate) * 1e18;
    
    // Check if enough tokens are available
    require(
      presaleToken.balanceOf(address(this)) >= presaleTokenAmount,
      AvailableTokensLessThanRequestedPurchaseAmount(
        presaleToken.balanceOf(address(this)),
        presaleTokenAmount
      )
    );
    
    // Transfer payment from buyer to treasury
    require(
      paymentToken.transferFrom(
        msg.sender,
        treasuryAddress,
        paymentTokenAtomicAmount
      ),
      PaymentTokenTransferFailed(
        msg.sender,
        treasuryAddress,
        paymentTokenAtomicAmount
      )
    );

    // Create vesting schedule in vesting contract
    require(
      presaleToken.approve(vestingContractAddress, presaleTokenAmount),
      VestingScheduleCreationTokenApprovalFailed(
        msg.sender,
        presaleTokenAmount,
        vestingContractAddress
      )
    );
    require(
      vestingContract.addVestingSchedule(
        msg.sender,
        presaleTokenAmount,
        block.timestamp,
        vestingSchedule.vestingDuration,
        vestingSchedule.vestingCliff
      ),
      VestingScheduleCreationFailed(
        msg.sender,
        presaleTokenAmount,
        block.timestamp,
        vestingSchedule.vestingDuration,
        vestingSchedule.vestingCliff
      )
    );
    
    presaleTokensSold += presaleTokenAmount;
    emit TokensPurchased(
      msg.sender,
      presaleTokenAmount,
      paymentTokenAddress,
      paymentTokenAtomicAmount,
      rate
    );
  }
}
