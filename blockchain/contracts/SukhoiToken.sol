// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SukhoiToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    event MessageSent(address indexed from, address indexed to, uint256 amount, string message, uint256 fee);

    uint256 public messageFee = 1 * 10 ** 17; // Default 0.1 SKH fee

    constructor(address initialOwner)
        ERC20("Sukhoi", "SKH")
        Ownable(initialOwner)
    {
        _mint(initialOwner, 250 * 10 ** decimals());
        _mint(address(this), 250 * 10 ** decimals());
    }

    function setMessageFee(uint256 newFee) external onlyOwner {
        messageFee = newFee;
    }

    function sendWithMemo(address to, uint256 amount, string calldata message) external {
        require(to != address(0), "ERC20: transfer to the zero address");
        uint256 totalCharge = amount + messageFee;
        require(balanceOf(msg.sender) >= totalCharge, "SukhoiToken: insufficient balance for transfer and message fee");

        // Burn the message fee
        _burn(msg.sender, messageFee);
        
        // Transfer the actual tokens
        _transfer(msg.sender, to, amount);

        emit MessageSent(msg.sender, to, amount, message, messageFee);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= 500 * 10 ** decimals(), "SukhoiToken: total supply limit exceeded (max 500 SKH)");
        _mint(to, amount);
    }

    function withdrawReserve(address to, uint256 amount) external onlyOwner {
        _transfer(address(this), to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
