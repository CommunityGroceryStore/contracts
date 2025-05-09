// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
  AccessControlEnumerable
} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";

contract CGSToken is ERC20, AccessControlEnumerable {
  bytes32 public constant TOKEN_ADMIN_ROLE = keccak256("TOKEN_ADMIN_ROLE");

  bool public isTaxPaused = false;
  bool public isTaxPermanentlyDisabled = false;
  uint256 public constant TAX_DIVISOR = 100_000;
  uint256 public constant MAX_TAX_RATE = 20_000; // 20% max tax rate
  uint256 public taxBuyRate = 1_000; // 1% buy tax
  uint256 public taxSellRate = 1_000; // 1% sell tax
  mapping(address => bool) public isExemptFromTax;
  mapping(address => bool) public liquidityProviders;
  address public treasuryAddress;

  event TaxExemptionAdded(address indexed account);
  event TaxExemptionRemoved(address indexed account);
  event TaxPaused();
  event TaxUnpaused();
  event TaxPermanentlyDisabled();
  event TaxBuyRateSet(uint256 taxBuyRate);
  event TaxSellRateSet(uint256 taxSellRate);
  event LiquidityProviderAdded(address indexed provider);
  event LiquidityProviderRemoved(address indexed provider);
  event TreasuryAddressSet(address treasuryAddress);

  constructor(
    address newOwner,
    uint256 initialSupply
  ) payable ERC20("Community Grocery Store", "CGS") {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(DEFAULT_ADMIN_ROLE, newOwner);
    _grantRole(TOKEN_ADMIN_ROLE, msg.sender);
    _grantRole(TOKEN_ADMIN_ROLE, newOwner);

    _mint(newOwner, initialSupply);

    setTreasuryAddress(newOwner);
    addTaxExemption(newOwner);
    addTaxExemption(address(this));
    addTaxExemption(address(0xdead));
    addTaxExemption(address(0));

    renounceRole(DEFAULT_ADMIN_ROLE, msg.sender);
    renounceRole(TOKEN_ADMIN_ROLE, msg.sender);
  }

  receive() external payable {}

  function addTaxExemption(address account) public onlyRole(TOKEN_ADMIN_ROLE) {
    isExemptFromTax[account] = true;
    emit TaxExemptionAdded(account);
  }

  function removeTaxExemption(
    address account
  ) public onlyRole(TOKEN_ADMIN_ROLE) {
    isExemptFromTax[account] = false;
    emit TaxExemptionRemoved(account);
  }

  function pauseTax() public onlyRole(TOKEN_ADMIN_ROLE) {
    isTaxPaused = true;
    emit TaxPaused();
  }

  function unpauseTax() public onlyRole(TOKEN_ADMIN_ROLE) {
    isTaxPaused = false;
    emit TaxUnpaused();
  }

  function permanentlyDisableTax() public onlyRole(TOKEN_ADMIN_ROLE) {
    pauseTax();
    isTaxPermanentlyDisabled = true;
    emit TaxPermanentlyDisabled();
  }

  function setBuyTaxRate(
    uint256 newTaxBuyRate
  ) public onlyRole(TOKEN_ADMIN_ROLE) {
    require(!isTaxPermanentlyDisabled, "Tax is permanently disabled");
    require(
      newTaxBuyRate <= MAX_TAX_RATE,
      "Tax rate cannot exceed MAX_TAX_RATE"
    );
    taxBuyRate = newTaxBuyRate;
    emit TaxBuyRateSet(taxBuyRate);
  }

  function setSellTaxRate(
    uint256 newTaxSellRate
  ) public onlyRole(TOKEN_ADMIN_ROLE) {
    require(!isTaxPermanentlyDisabled, "Tax is permanently disabled");
    require(
      newTaxSellRate <= MAX_TAX_RATE,
      "Tax rate cannot exceed MAX_TAX_RATE"
    );
    taxSellRate = newTaxSellRate;
    emit TaxSellRateSet(taxSellRate);
  }

  function addLiquidityProvider(
    address provider
  ) public onlyRole(TOKEN_ADMIN_ROLE) {
    liquidityProviders[provider] = true;
    emit LiquidityProviderAdded(provider);
  }

  function removeLiquidityProvider(
    address provider
  ) public onlyRole(TOKEN_ADMIN_ROLE) {
    liquidityProviders[provider] = false;
    emit LiquidityProviderRemoved(provider);
  }

  function getTreasuryAddress() public view returns (address) {
    return treasuryAddress;
  }

  function setTreasuryAddress(
    address newTreasuryAddress
  ) public onlyRole(TOKEN_ADMIN_ROLE) {
    require(newTreasuryAddress != address(0), "Invalid treasury address");
    require(newTreasuryAddress != address(0xdead), "Invalid treasury address");
    treasuryAddress = newTreasuryAddress;
    emit TreasuryAddressSet(newTreasuryAddress);
  }

  function withdrawETH() external onlyRole(TOKEN_ADMIN_ROLE) {
    uint256 balance = address(this).balance;
    require(balance > 0, "No ETH to withdraw");
    
    (bool success, ) = payable(treasuryAddress).call{value: balance}("");
    require(success, "ETH withdrawal failed");
  }

  function withdrawERC20(
    address tokenAddress
  ) external onlyRole(TOKEN_ADMIN_ROLE) {
    IERC20 token = IERC20(tokenAddress);
    uint256 balance = token.balanceOf(address(this));
    require(balance > 0, "No tokens to withdraw");
    
    bool success = token.transfer(treasuryAddress, balance);
    require(success, "ERC20 withdrawal failed");
  }

  function _update(
    address from,
    address to,
    uint256 amount
  ) internal override {
    bool shouldTakeTax = !isTaxPaused && // tax is not paused
      !isTaxPermanentlyDisabled && // tax is not permanently disabled
      !isExemptFromTax[from] && // from address is not exempt
      !isExemptFromTax[to] && // to address is not exempt
      // at least one address is a liquidity provider
      (liquidityProviders[from] || liquidityProviders[to]);

    uint256 taxRate = 0;
    if (shouldTakeTax && liquidityProviders[from]) {
      taxRate = taxBuyRate;
    } else if (shouldTakeTax && liquidityProviders[to]) {
      taxRate = taxSellRate;
    }

    if (shouldTakeTax && taxRate > 0) {
      uint256 taxAmount = (amount * taxRate) / TAX_DIVISOR;
      amount -= taxAmount;

      super._update(from, treasuryAddress, taxAmount);
    }

    super._update(from, to, amount);
  }
}
