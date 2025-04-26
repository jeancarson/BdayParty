// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PartyTicket is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant TICKET_PRICE = 0.01 ether;
    uint256 public constant MAX_SUPPLY = 1000;

    event TicketPurchased(address buyer, uint256 amount);
    event TicketRedeemed(address holder, uint256 amount);

    constructor() ERC20("Party Ticket", "PARTY") {
        // Constructor logic
    }

    function purchaseTickets(uint256 numberOfTickets) public payable nonReentrant {
        require(numberOfTickets > 0, "Must purchase at least one ticket");
        require(totalSupply() + numberOfTickets <= MAX_SUPPLY, "Not enough tickets available");
        require(msg.value >= numberOfTickets * TICKET_PRICE, "Insufficient payment");

        _mint(msg.sender, numberOfTickets);
        emit TicketPurchased(msg.sender, numberOfTickets);

        // Return excess payment if any
        if (msg.value > numberOfTickets * TICKET_PRICE) {
            payable(msg.sender).transfer(msg.value - (numberOfTickets * TICKET_PRICE));
        }
    }

    function redeemTickets(uint256 amount) public nonReentrant {
        require(amount > 0, "Must redeem at least one ticket");
        require(balanceOf(msg.sender) >= amount, "Insufficient tickets");

        _burn(msg.sender, amount);
        emit TicketRedeemed(msg.sender, amount);
    }

    function withdrawFunds() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
