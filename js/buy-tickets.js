let contract;
let currentWallet;
const contractAddress = '0x77481B4bd23Ef04Fbd649133E5955b723863C52D'; 
let isTransactionPending = false; // Track if there's a pending transaction

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
        button.disabled = buttonId === 'purchaseButton' ? !currentWallet : false;
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
            
            // Update wallet info
            document.getElementById('walletAddress').textContent = currentWallet.address;
            
            // Get and display ETH balance
            const balance = await web3.eth.getBalance(currentWallet.address);
            document.getElementById('ethBalance').textContent = web3.utils.fromWei(balance, 'ether');
            
            // Get and display current ticket balance
            if (contract) {
                const ticketBalance = await contract.methods.balanceOf(currentWallet.address).call();
                document.getElementById('currentTickets').textContent = ticketBalance;
            }

            // Enable purchase button
            document.getElementById('purchaseButton').disabled = false;

            // Update available tickets
            await updateEventInfo();
        } catch (error) {
            showError('Failed to decrypt wallet: ' + error.message);
        } finally {
            setLoading('loadWallet', false);
        }
    };
    reader.readAsText(fileInput.files[0]);
}

async function updateEventInfo() {
    if (!contract) return;

    try {
        // Get ticket price
        const price = await contract.methods.ticketPrice().call();
        document.getElementById('ticketPrice').textContent = web3.utils.fromWei(price, 'ether');

        // Get available tickets
        const vendorAddress = await contract.methods.vendor().call();
        const availableTickets = await contract.methods.balanceOf(vendorAddress).call();
        document.getElementById('availableTickets').textContent = availableTickets;

        // Update total cost based on current number of tickets
        updateTotalCost();
    } catch (error) {
        showError('Failed to fetch event information: ' + error.message);
    }
}

function updateTotalCost() {
    const ticketPrice = parseFloat(document.getElementById('ticketPrice').textContent);
    const numberOfTickets = parseInt(document.getElementById('numberOfTickets').value);
    const totalCost = ticketPrice * numberOfTickets;
    document.getElementById('totalCost').textContent = totalCost.toFixed(6);
}

async function purchaseTickets() {
    if (!currentWallet || !contract) {
        showError('Please load your wallet first');
        return;
    }

    // Prevent multiple transactions while one is pending
    if (isTransactionPending) {
        showError('A transaction is already in progress. Please wait for it to complete.');
        return;
    }

    const numberOfTickets = parseInt(document.getElementById('numberOfTickets').value);
    if (numberOfTickets <= 0) {
        showError('Please enter a valid number of tickets');
        return;
    }

    try {
        setLoading('purchaseButton', true);
        isTransactionPending = true; // Mark transaction as pending
        
        const price = await contract.methods.ticketPrice().call();
        const totalCost = new web3.utils.BN(price).mul(new web3.utils.BN(numberOfTickets));

        // Check if user has enough balance for the transaction
        const balance = await web3.eth.getBalance(currentWallet.address);
        if (new web3.utils.BN(balance).lt(totalCost)) {
            showError('You do not have enough ETH to complete this purchase. Please add funds to your wallet.');
            setLoading('purchaseButton', false);
            isTransactionPending = false;
            return;
        }

        // Check if there are enough tickets available
        const vendorAddress = await contract.methods.vendor().call();
        const availableTickets = await contract.methods.balanceOf(vendorAddress).call();
        if (numberOfTickets > parseInt(availableTickets)) {
            showError(`Not enough tickets available. Only ${availableTickets} tickets left.`);
            setLoading('purchaseButton', false);
            isTransactionPending = false;
            return;
        }

        // Create the transaction
        const tx = contract.methods.buyTickets(numberOfTickets);
        const gas = await tx.estimateGas({ from: currentWallet.address, value: totalCost });
        
        // Get current nonce to ensure transaction uniqueness
        const nonce = await web3.eth.getTransactionCount(currentWallet.address, 'pending');
        
        // Sign the transaction
        const signedTx = await web3.eth.accounts.signTransaction({
            to: contractAddress,
            data: tx.encodeABI(),
            gas: Math.floor(gas * 1.2), // Add 20% buffer to gas
            value: totalCost,
            from: currentWallet.address,
            nonce: nonce // Add explicit nonce to prevent duplicates
        }, currentWallet.privateKey);

        // Just send the transaction without waiting for confirmation
        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .on('transactionHash', (hash) => {
                console.log('Transaction hash:', hash);
                showSuccess('Transaction sent! Transaction hash: ' + hash, 10000);
                
                // Update UI after a short delay
                setTimeout(async () => {
                    try {
                        await updateEventInfo();
                        const balance = await web3.eth.getBalance(currentWallet.address);
                        document.getElementById('ethBalance').textContent = web3.utils.fromWei(balance, 'ether');
                        
                        const ticketBalance = await contract.methods.balanceOf(currentWallet.address).call();
                        document.getElementById('currentTickets').textContent = ticketBalance;
                    } catch (updateError) {
                        console.error('Balance update error:', updateError);
                    } finally {
                        setLoading('purchaseButton', false);
                        isTransactionPending = false; // Reset transaction pending status
                    }
                }, 3000);
            })
            .on('error', (error) => {
                console.error('Transaction error:', error);
                
                // Handle common errors with more user-friendly messages
                if (error.message.includes('already known')) {
                    showSuccess('Your transaction was already submitted and is being processed.', 10000);
                } else if (error.message.includes('insufficient funds')) {
                    showError('You do not have enough ETH to complete this purchase. The transaction failed due to insufficient funds.');
                } else if (error.message.includes('Not enough tickets available')) {
                    showError('There are not enough tickets available for purchase.');
                } else {
                    showError('Failed to purchase tickets: ' + error.message);
                }
                
                setLoading('purchaseButton', false);
                isTransactionPending = false; // Reset transaction pending status
            });
    } catch (error) {
        console.error('Purchase preparation error:', error);
        
        // Handle preparation errors with more user-friendly messages
        if (error.message.includes('gas required exceeds allowance')) {
            showError('Transaction would exceed gas limits. Try purchasing fewer tickets.');
        } else if (error.message.includes('insufficient funds')) {
            showError('You do not have enough ETH to complete this purchase.');
        } else {
            showError('Failed to prepare transaction: ' + error.message);
        }
        
        setLoading('purchaseButton', false);
        isTransactionPending = false; // Reset transaction pending status
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (await initWeb3()) {
            // Initialize contract with proper ABI
            if (contractAddress) {
                const contractABI = [
                    {
                        "inputs": [],
                        "name": "ticketPrice",
                        "outputs": [
                            {
                                "internalType": "uint256",
                                "name": "",
                                "type": "uint256"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [],
                        "name": "vendor",
                        "outputs": [
                            {
                                "internalType": "address",
                                "name": "",
                                "type": "address"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "account",
                                "type": "address"
                            }
                        ],
                        "name": "balanceOf",
                        "outputs": [
                            {
                                "internalType": "uint256",
                                "name": "",
                                "type": "uint256"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "numberOfTickets",
                                "type": "uint256"
                            }
                        ],
                        "name": "buyTickets",
                        "outputs": [],
                        "stateMutability": "payable",
                        "type": "function"
                    }
                ];
                contract = new web3.eth.Contract(contractABI, contractAddress);
                
                // Wrap the updateEventInfo in a try-catch and add a small delay
                setTimeout(async () => {
                    try {
                        await updateEventInfo();
                    } catch (error) {
                        console.log('Initial contract data fetch failed, will retry on user interaction');
                    }
                }, 1000);
            }
        }
    } catch (error) {
        console.log('Initial setup error:', error);
    }
    
    // Add event listeners
    document.getElementById('loadWallet').addEventListener('click', loadWallet);
    document.getElementById('numberOfTickets').addEventListener('input', updateTotalCost);
    document.getElementById('purchaseButton').addEventListener('click', purchaseTickets);
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('errorModal').style.display = 'none';
    });
});