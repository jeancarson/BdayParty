# Birthday Party Ticket System 🎈

A decentralized ticket management system built on the Ethereum blockchain (Holesky testnet) for managing party entry tickets. This dApp allows users to purchase, check, and redeem tickets for the party using smart contracts.

## Features 🌟

- Create and manage Ethereum wallets
- Purchase party tickets using ETH
- Check ticket balances and transaction history
- Redeem tickets at the party entrance
- Secure wallet encryption/decryption
- Real-time blockchain interaction
- Loading indicators for all blockchain operations

## Technical Stack 💻

- **Frontend**: HTML, CSS, JavaScript
- **Blockchain**: Ethereum (Holesky Testnet)
- **Web3 Library**: web3.js
- **Smart Contract**: Solidity (ERC20-based)
- **Design**: Custom CSS with responsive design

## Smart Contract Details 📄

The `PartyTicket` smart contract (`EventTicket.sol`) is deployed on the Holesky testnet and implements:

- ERC20 token standard for ticket representation
- Fixed ticket price: 0.01 ETH
- Maximum supply: 1000 tickets
- Ticket purchase functionality
- Ticket redemption system
- Owner withdrawal capabilities

Contract Address: `0x77481B4bd23Ef04Fbd649133E5955b723863C52D`

## Getting Started 🚀

### Prerequisites

- Modern web browser
- Internet connection
- Some Holesky testnet ETH (for purchasing tickets)

### Using the Application

1. **Create a Wallet**
   - Visit the "Create Wallet" page
   - Enter a secure password
   - Download and safely store your keystore file
   - Keep your private key secure

2. **Purchase Tickets**
   - Go to "Buy Tickets"
   - Load your wallet using the keystore file
   - Enter the number of tickets you want
   - Confirm the transaction with sufficient ETH

3. **Check Balance**
   - Visit "Check Balance"
   - Load your wallet
   - View your ETH and ticket balances
   - See network and wallet details

4. **Redeem Tickets**
   - Go to "Redeem Tickets"
   - Load your wallet
   - Enter the number of tickets to redeem
   - Confirm the redemption

## Security Features 🔒

- Client-side wallet encryption/decryption
- No private key storage on servers
- Secure keystore file generation
- Transaction signing on client side
- Loading states to prevent double submissions

## File Structure 📁

```
├── index.html           # Wallet creation page
├── buy-tickets.html     # Ticket purchase interface
├── check-balance.html   # Balance checking interface
├── redeem-tickets.html  # Ticket redemption interface
├── EventTicket.sol      # Smart contract
├── myProject.css        # Styling
├── shared.js           # Shared utilities
└── Various .js files   # Page-specific logic
```

## Usage Tips 💡

1. **Wallet Security**
   - Always keep your keystore file safe
   - Never share your private key
   - Use a strong password for encryption

2. **Transactions**
   - Ensure sufficient ETH for gas fees
   - Wait for transaction confirmations
   - Check transaction status in MetaMask or block explorer

3. **Ticket Management**
   - Purchase tickets early due to limited supply
   - Keep track of your ticket balance
   - Redeem tickets only at the party entrance

## Error Handling 🔧

The application includes comprehensive error handling for:
- Failed transactions
- Network issues
- Invalid inputs
- Insufficient funds
- Contract interaction failures

## Development 👨‍💻

To modify or extend the application:

1. Clone the repository
2. Make sure you have Node.js and npm installed
3. Install web3.js and other dependencies
4. Deploy your own version of the smart contract
5. Update the contract address in the JavaScript files

## Testing 🧪

The application can be tested using:
- Holesky testnet
- Local Ethereum node
- Ganache for local development

## Contributing 🤝

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License 📜

This project is licensed under the MIT License.

## Support 💪

For support or questions:
1. Open an issue in the repository
2. Contact the development team
3. Check the smart contract on Etherscan

Remember to never share private keys or passwords when seeking support! 