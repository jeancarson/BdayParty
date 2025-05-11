let contract;
let currentWallet;
const contractAddress = '0x77481B4bd23Ef04Fbd649133E5955b723863C52D';
let isTransactionPending = false; // Track if there's a pending transaction

const contractABI = [
    {
        "inputs": [],
        "name": "ticketPrice",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "vendor",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "numberOfTickets", "type": "uint256" }],
        "name": "buyTickets",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "numberOfTickets", "type": "uint256" }],
        "name": "useTicket",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

async function initWeb3() {
    // List of Holesky RPC providers to try in order
    const rpcProviders = [
        "https://ethereum-holesky.publicnode.com",
        "https://1rpc.io/holesky",
        "https://holesky.api.onfinality.io/public",
        "https://holesky.blockpi.network/v1/rpc/public",
        "https://holesky.drpc.org"
    ];
    
    // Use MetaMask if available
    if (typeof window.ethereum !== 'undefined') {
        window.web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log("Using MetaMask provider");
            return true;
        } catch (error) {
            console.warn("MetaMask connection failed, trying other RPC providers");
            // Fall through to RPC providers
        }
    }
    
    // Try each RPC provider until one works
    for (const rpcUrl of rpcProviders) {
        try {
            console.log(`Trying RPC provider: ${rpcUrl}`);
            window.web3 = new Web3(rpcUrl);
            
            // Test the connection
            await window.web3.eth.net.isListening();
            console.log(`Successfully connected to ${rpcUrl}`);
            return true;
        } catch (error) {
            console.warn(`RPC provider ${rpcUrl} failed:`, error.message);
        }
    }
    
    showError("Failed to connect to any Ethereum RPC provider. Please try again later.");
    return false;
}

function setLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = buttonId === 'useButton' ? !currentWallet || document.getElementById('currentTickets').textContent <= 0 : false;
    }
}

async function loadWallet() {
    const fileInput = document.getElementById('keystoreFile');
    const password = document.getElementById('password').value;

    if (!fileInput.files[0]) {
        showError('Please select a keystore file');
        return;
    }

    setLoading('loadWallet', true);
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const keystore = JSON.parse(e.target.result);
            currentWallet = await web3.eth.accounts.decrypt(keystore, password);
            
            document.getElementById('walletAddress').textContent = currentWallet.address;
            
            if (contract) {
                await updateBalance();
            }
        } catch (error) {
            showError('Failed to decrypt wallet: ' + error.message);
        } finally {
            setLoading('loadWallet', false);
        }
    };
    reader.readAsText(fileInput.files[0]);
}

async function redeemTickets() {
    if (!currentWallet || !contract) {
        showError('Please load your wallet first');
        return;
    }

    // Prevent multiple transactions while one is pending
    if (isTransactionPending) {
        showError('A transaction is already in progress. Please wait for it to complete.');
        return;
    }

    const ticketsToRedeem = parseInt(document.getElementById('ticketsToRedeem').value);
    if (!ticketsToRedeem || ticketsToRedeem <= 0) {
        showError('Please enter a valid number of tickets to redeem');
        return;
    }

    try {
        // Check if user has enough tickets to redeem
        const ticketBalance = await contract.methods.balanceOf(currentWallet.address).call();
        if (parseInt(ticketBalance) < ticketsToRedeem) {
            showError(`You don't have enough tickets. Your current balance is ${ticketBalance} tickets.`);
            return;
        }

        setLoading('useButton', true);
        isTransactionPending = true; // Mark transaction as pending
        
        const tx = contract.methods.useTicket(ticketsToRedeem);
        const gas = await tx.estimateGas({ from: currentWallet.address });

        // Get current nonce to ensure transaction uniqueness
        const nonce = await web3.eth.getTransactionCount(currentWallet.address, 'pending');

        const signedTx = await web3.eth.accounts.signTransaction({
            to: contractAddress,
            data: tx.encodeABI(),
            gas: gas,
            from: currentWallet.address,
            nonce: nonce // Add explicit nonce to prevent duplicates
        }, currentWallet.privateKey);

        // Send the transaction without waiting for confirmation
        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .on('transactionHash', (hash) => {
                console.log('Transaction hash:', hash);
                showSuccess(`Transaction sent! ${ticketsToRedeem} tickets redeemed. Transaction hash: ${hash}`, 10000);
                
                // Update UI after a short delay
                setTimeout(async () => {
                    try {
                        await updateBalance();
                    } catch (updateError) {
                        console.error('Balance update error:', updateError);
                    } finally {
                        setLoading('useButton', false);
                        isTransactionPending = false; // Reset transaction pending status
                    }
                }, 3000);
            })
            .on('error', (error) => {
                console.error('Transaction error:', error);
                
                // Handle common errors with more user-friendly messages
                if (error.message.includes('already known')) {
                    showSuccess('Your transaction was already submitted and is being processed.', 10000);
                } else if (error.message.includes('Insufficient tickets')) {
                    showError('You do not have enough tickets to complete this redemption.');
                } else {
                    showError('Failed to redeem tickets: ' + error.message);
                }
                
                setLoading('useButton', false);
                isTransactionPending = false; // Reset transaction pending status
            });
    } catch (error) {
        console.error('Redemption preparation error:', error);
        
        // Handle preparation errors with more user-friendly messages
        if (error.message.includes('Insufficient tickets')) {
            showError('You do not have enough tickets to redeem. Please check your ticket balance.');
        } else if (error.message.includes('gas required exceeds allowance')) {
            showError('Transaction would exceed gas limits. Try redeeming fewer tickets.');
        } else {
            showError('Failed to prepare transaction: ' + error.message);
        }
        
        setLoading('useButton', false);
        isTransactionPending = false; // Reset transaction pending status
    }
}

async function updateBalance() {
    if (!contract || !currentWallet) return;

    try {
        const updatedBalance = await contract.methods.balanceOf(currentWallet.address).call();
        document.getElementById('currentTickets').textContent = updatedBalance;
        document.getElementById('useButton').disabled = updatedBalance <= 0;
    } catch (error) {
        console.error('Failed to update balance:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (await initWeb3()) {
        if (contractAddress) {
            contract = new web3.eth.Contract(contractABI, contractAddress);
        }
    }

    document.getElementById('loadWallet').addEventListener('click', loadWallet);
    document.getElementById('useButton').addEventListener('click', redeemTickets);
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('errorModal').style.display = 'none';
    });
});
