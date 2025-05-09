// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
  AccessControlEnumerable
} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";

contract CGSTokenPresale is AccessControlEnumerable {
  bytes32 public constant PRESALE_ADMIN_ROLE = keccak256("PRESALE_ADMIN_ROLE");
  uint256 public constant MINIMUM_PRESALE_PURCHASE = 1e5; // $0.01 USDT/USDC

  bool public isPresalePaused = true;
  address public treasuryAddress;
  address public tokenAddress;
  IERC20 public presaleToken;
  struct PaymentToken {
    address tokenAddress;
    // Rate is in terms of atomic payment tokens per whole presale token
    // e.g. 40_000 means $0.04 USDT per 1 presale token
    uint256 rate;
  }
  mapping(address => PaymentToken) public paymentTokens;
  uint256 public presaleTokensSold;

  event PresalePaused();
  event PresaleUnpaused();
  event TreasuryAddressSet(address treasuryAddress);
  event PaymentTokenAdded(address token, uint256 rate);
  event PaymentTokenRemoved(address token);
  event TokensPurchased(
    address purchaser,
    uint256 _tokenAmount,
    address _paymentToken,
    uint256 paymentAmount,
    uint256 rate
  );

  constructor(address newOwner, address _tokenAddress) payable {
    _grantRole(DEFAULT_ADMIN_ROLE, newOwner);
    _grantRole(PRESALE_ADMIN_ROLE, newOwner);
    tokenAddress = _tokenAddress;
    presaleToken = IERC20(_tokenAddress);
    treasuryAddress = newOwner;
  }

  receive() external payable {}

  function withdrawETH() external onlyRole(PRESALE_ADMIN_ROLE) {
    uint256 balance = address(this).balance;
    require(balance > 0, "No ETH to withdraw");
    
    (bool success, ) = payable(treasuryAddress).call{value: balance}("");
    require(success, "ETH withdrawal failed");
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
    isPresalePaused = false;
    emit PresaleUnpaused();
  }

  function setTreasuryAddress(address newTreasuryAddress) public onlyRole(PRESALE_ADMIN_ROLE) {
    treasuryAddress = newTreasuryAddress;
    emit TreasuryAddressSet(newTreasuryAddress);
  }

  function addPaymentToken(address _paymentTokenAddress, uint256 _rate) public onlyRole(PRESALE_ADMIN_ROLE) {    
    paymentTokens[_paymentTokenAddress] = PaymentToken({
      tokenAddress: _paymentTokenAddress,
      rate: _rate
    });
  }

  function removePaymentToken(address _token) public onlyRole(PRESALE_ADMIN_ROLE) {    
    delete paymentTokens[_token];
  }

  function buy(uint256 _paymentTokenAtomicAmount, address _paymentToken) external {
    require(!isPresalePaused, "Presale is paused");
    require(paymentTokens[_paymentToken].tokenAddress != address(0), "Invalid payment token");
    require(_paymentTokenAtomicAmount >= MINIMUM_PRESALE_PURCHASE, "Invalid payment amount");
    
    IERC20 paymentToken = IERC20(paymentTokens[_paymentToken].tokenAddress);
    uint256 rate = paymentTokens[_paymentToken].rate;

    uint256 presaleTokenAmount = (_paymentTokenAtomicAmount / rate) * 1e18;
    
    // Check if enough tokens are available
    require(presaleToken.balanceOf(address(this)) >= presaleTokenAmount, "Insufficient tokens in contract");
    
    // Transfer payment from buyer to treasury
    require(paymentToken.transferFrom(msg.sender, treasuryAddress, _paymentTokenAtomicAmount), "Payment transfer failed");
    
    // Transfer tokens to buyer
    require(presaleToken.transfer(msg.sender, presaleTokenAmount), "Token transfer failed");
    
    presaleTokensSold += presaleTokenAmount;
    emit TokensPurchased(msg.sender, presaleTokenAmount, _paymentToken, _paymentTokenAtomicAmount, rate);
  }
}
