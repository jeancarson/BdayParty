# Jean's Birthday Party - Ticket Management System

A decentralized ticket management system built on the Ethereum blockchain (Holesky testnet) for managing party entry tickets. This dApp allows users to purchase, check, and redeem tickets for the party using smart contracts.

## Project Structure

```
BdayParty/
├── css/                  # CSS stylesheets
│   └── styles.css     # Main stylesheet
├── js/                   # JavaScript files
│   ├── shared.js         # Shared utility functions
│   ├── index.js          # Wallet creation functionality
│   ├── check-balance.js  # Balance checking functionality
│   ├── buy-tickets.js    # Ticket purchasing functionality
│   └── redeem-tickets.js # Ticket redemption functionality
├── img/                  # Image assets
│   └── balloons.jpg      # Party graphics
├── contracts/            # Smart contracts
│   └── EventTicket.sol   # ERC-20 token contract for tickets
├── index.html            # Entry point - Create wallet page
├── check-balance.html    # Check wallet and ticket balance
├── buy-tickets.html      # Purchase tickets page
├── redeem-tickets.html   # Redeem tickets page
├── test.html             # Testing utilities
└── package.json          # Project configuration
```

## Features

- **Create Wallet**: Generate a new Ethereum wallet and download keystore
- **Check Balance**: View ETH balance and ticket holdings
- **Buy Tickets**: Purchase tickets using ETH (Holesky testnet)
- **Redeem Tickets**: Use tickets to gain entry to the party

## Getting Started

### Prerequisites

- Modern web browser with JavaScript enabled
- Internet connection
- For development: Node.js and Python

### Installation

1. Clone this repository:
   ```
   git clone <repository-url>
   cd BdayParty
   ```

2. Start a server:

   Open `index.html`with live server

### Usage Guide

1. **Create a Wallet**:
   - Open the application in your browser
   - Enter a password
   - Click "Create New Wallet"
   - Download the keystore file for safekeeping

2. **Check Balance**:
   - Navigate to the "Check Balance" page
   - Upload your keystore file and enter your password
   - View your ETH balance and tickets owned

3. **Buy Tickets**:
   - Navigate to the "Buy Tickets" page
   - Upload your keystore file and enter your password
   - Select the number of tickets to purchase
   - Click "Purchase Tickets"

4. **Redeem Tickets**:
   - Navigate to the "Redeem Tickets" page
   - Upload your keystore file and enter your password
   - Select the number of tickets to redeem
   - Click "Redeem Tickets"

## Smart Contract

The tickets are implemented as ERC-20 tokens on the Ethereum Holesky testnet. The contract address is:
```
0x77481B4bd23Ef04Fbd649133E5955b723863C52D
```

## Technical Details

- Built with vanilla JavaScript, HTML, and CSS
- Uses Web3.js for Ethereum blockchain interaction
- Implements multiple RPC provider fallbacks for reliability
- Supports keystores for secure wallet storage

## License

ISC License 