// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./StBTC.sol";

/**
 * @title Vault
 * @dev Babylon-compatible Vault contract for managing Bitcoin deposits and stBTC minting
 */
contract Vault is ReentrancyGuard, Ownable, Pausable {
    StBTC public immutable stBTC;
    
    struct BabylonDeposit {
        address user;
        uint256 amount;
        string btcTxHash;
        uint256 unlockTime;
        string finalityProvider;
        uint256 timestamp;
        bool processed;
    }
    
    mapping(string => BabylonDeposit) public deposits;
    mapping(address => uint256) public userBalances;
    mapping(string => bool) public authorizedFinalityProviders;
    
    uint256 public totalDeposits;
    uint256 public constant MINIMUM_CONFIRMATIONS = 6;
    
    event DepositRegistered(
        string indexed btcTxHash,
        address indexed user,
        uint256 amount,
        uint256 unlockTime,
        string finalityProvider
    );
    
    event StBTCMinted(
        string indexed btcTxHash,
        address indexed user,
        uint256 amount
    );
    
    event FinalityProviderAuthorized(string indexed provider);
    event FinalityProviderDeauthorized(string indexed provider);
    
    event WithdrawalRequested(
        address indexed user,
        uint256 amount,
        string btcAddress
    );
    
    modifier onlyRelayer() {
        require(msg.sender == owner(), "Only relayer can call");
        _;
    }
    
    constructor(address _stBTC) {
        require(_stBTC != address(0), "Invalid stBTC address");
        stBTC = StBTC(_stBTC);
        
        // Authorize default finality providers
        authorizedFinalityProviders["fp1"] = true;
        authorizedFinalityProviders["fp2"] = true;
        emit FinalityProviderAuthorized("fp1");
        emit FinalityProviderAuthorized("fp2");
    }
    
    /**
     * @dev Register a Babylon Bitcoin deposit
     * @param btcTxHash Bitcoin transaction hash
     * @param user User address to mint tokens to
     * @param amount Amount in satoshis
     * @param unlockTime Unix timestamp when Bitcoin can be unlocked
     * @param finalityProvider Babylon finality provider identifier
     */
    function registerBabylonDeposit(
        string calldata btcTxHash,
        address user,
        uint256 amount,
        uint256 unlockTime,
        string calldata finalityProvider
    ) external onlyRelayer whenNotPaused nonReentrant {
        require(bytes(btcTxHash).length > 0, "Invalid transaction hash");
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        require(unlockTime > block.timestamp, "Unlock time must be in future");
        require(authorizedFinalityProviders[finalityProvider], "Unauthorized finality provider");
        require(deposits[btcTxHash].timestamp == 0, "Deposit already registered");
        
        deposits[btcTxHash] = BabylonDeposit({
            user: user,
            amount: amount,
            btcTxHash: btcTxHash,
            unlockTime: unlockTime,
            finalityProvider: finalityProvider,
            timestamp: block.timestamp,
            processed: false
        });
        
        emit DepositRegistered(btcTxHash, user, amount, unlockTime, finalityProvider);
    }
    
    /**
     * @dev Mint stBTC tokens for a registered Babylon deposit
     * @param btcTxHash Bitcoin transaction hash to process
     */
    function mintStBTC(string calldata btcTxHash) external onlyRelayer whenNotPaused nonReentrant {
        BabylonDeposit storage deposit = deposits[btcTxHash];
        
        require(deposit.timestamp > 0, "Deposit not registered");
        require(!deposit.processed, "Deposit already processed");
        
        // Convert satoshis to 18-decimal token amount (1 BTC = 1 stBTC)
        uint256 tokenAmount = deposit.amount * 10**10; // Convert 8 decimals to 18 decimals
        
        // Update state
        deposit.processed = true;
        userBalances[deposit.user] += tokenAmount;
        totalDeposits += tokenAmount;
        
        // Mint stBTC tokens
        stBTC.mint(deposit.user, tokenAmount);
        
        emit StBTCMinted(btcTxHash, deposit.user, tokenAmount);
    }
    
    /**
     * @dev Authorize a finality provider
     * @param provider Finality provider identifier
     */
    function authorizeFinalityProvider(string calldata provider) external onlyOwner {
        authorizedFinalityProviders[provider] = true;
        emit FinalityProviderAuthorized(provider);
    }
    
    /**
     * @dev Deauthorize a finality provider
     * @param provider Finality provider identifier
     */
    function deauthorizeFinalityProvider(string calldata provider) external onlyOwner {
        authorizedFinalityProviders[provider] = false;
        emit FinalityProviderDeauthorized(provider);
    }
    
    /**
     * @dev Request withdrawal (burns stBTC)
     * @param amount Amount to withdraw
     * @param btcAddress Bitcoin address to withdraw to
     */
    function requestWithdrawal(
        uint256 amount,
        string calldata btcAddress
    ) external whenNotPaused nonReentrant {
        require(amount > 0, "Invalid amount");
        require(bytes(btcAddress).length > 0, "Invalid Bitcoin address");
        require(stBTC.balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(userBalances[msg.sender] >= amount, "Insufficient vault balance");
        
        // Burn stBTC tokens
        stBTC.burn(msg.sender, amount);
        
        // Update balances
        userBalances[msg.sender] -= amount;
        totalDeposits -= amount;
        
        emit WithdrawalRequested(msg.sender, amount, btcAddress);
    }
    
    /**
     * @dev Get deposit information
     * @param btcTxHash Bitcoin transaction hash
     */
    function getDeposit(string calldata btcTxHash) external view returns (BabylonDeposit memory) {
        return deposits[btcTxHash];
    }
    
    /**
     * @dev Check if finality provider is authorized
     * @param provider Finality provider identifier
     */
    function isFinalityProviderAuthorized(string calldata provider) external view returns (bool) {
        return authorizedFinalityProviders[provider];
    }
    
    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
