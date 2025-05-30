// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title StBTC
 * @dev Staked Bitcoin token for Babylon protocol
 */
contract StBTC is ERC20, Ownable, Pausable {
    mapping(address => bool) public authorized;
    
    event AuthorizedAdded(address indexed account);
    event AuthorizedRemoved(address indexed account);
    
    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor() ERC20("Staked Bitcoin", "stBTC") {
        // Initial setup
    }
    
    /**
     * @dev Mint stBTC tokens
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyAuthorized whenNotPaused {
        _mint(to, amount);
    }
    
    /**
     * @dev Burn stBTC tokens
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external onlyAuthorized whenNotPaused {
        _burn(from, amount);
    }
    
    /**
     * @dev Add authorized minter/burner
     * @param account Address to authorize
     */
    function addAuthorized(address account) external onlyOwner {
        authorized[account] = true;
        emit AuthorizedAdded(account);
    }
    
    /**
     * @dev Remove authorized minter/burner
     * @param account Address to remove authorization
     */
    function removeAuthorized(address account) external onlyOwner {
        authorized[account] = false;
        emit AuthorizedRemoved(account);
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
