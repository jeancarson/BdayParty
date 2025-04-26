let contract;
let currentWallet;
const contractAddress = '0x77481B4bd23Ef04Fbd649133E5955b723863C52D'; 

async function initWeb3() {
    // Use Holesky RPC if MetaMask is not available
    if (typeof window.ethereum !== 'undefined') {
        window.web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error) {
            // Fallback to Holesky RPC
            window.web3 = new Web3("https://holesky.drpc.org");
        }
    } else {
        // Fallback to Holesky RPC
        window.web3 = new Web3("https://holesky.drpc.org");
    }
    return true;
}

async function loadWallet() {
    const fileInput = document.getElementById('keystoreFile');
    const password = document.getElementById('password').value;

    if (!fileInput.files[0]) {
        showError('Please select a keystore file');
        return;
    }

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

    const numberOfTickets = parseInt(document.getElementById('numberOfTickets').value);
    if (numberOfTickets <= 0) {
        showError('Please enter a valid number of tickets');
        return;
    }

    try {
        const price = await contract.methods.ticketPrice().call();
        const totalCost = new web3.utils.BN(price).mul(new web3.utils.BN(numberOfTickets));

        // Create the transaction
        const tx = contract.methods.buyTickets(numberOfTickets);
        const gas = await tx.estimateGas({ from: currentWallet.address, value: totalCost });
        
        // Sign and send the transaction
        const signedTx = await web3.eth.accounts.signTransaction({
            to: contractAddress,
            data: tx.encodeABI(),
            gas: gas,
            value: totalCost,
            from: currentWallet.address
        }, currentWallet.privateKey);

        // Send the transaction
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        // Update balances and available tickets
        await updateEventInfo();
        const balance = await web3.eth.getBalance(currentWallet.address);
        document.getElementById('ethBalance').textContent = web3.utils.fromWei(balance, 'ether');
        
        const ticketBalance = await contract.methods.balanceOf(currentWallet.address).call();
        document.getElementById('currentTickets').textContent = ticketBalance;

        showSuccess('Successfully purchased ' + numberOfTickets + ' tickets!');
    } catch (error) {
        showError('Failed to purchase tickets: ' + error.message);
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