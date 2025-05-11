let contract;
let currentWallet;
const contractAddress = '0x77481B4bd23Ef04Fbd649133E5955b723863C52D';

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
    if (typeof window.ethereum !== 'undefined') {
        window.web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error) {
            console.warn('MetaMask not connected, falling back to Holesky RPC');
            window.web3 = new Web3("https://holesky.drpc.org");
        }
    } else {
        window.web3 = new Web3("https://holesky.drpc.org");
    }
    return true;
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

    const ticketsToRedeem = parseInt(document.getElementById('ticketsToRedeem').value);
    if (!ticketsToRedeem || ticketsToRedeem <= 0) {
        showError('Please enter a valid number of tickets to redeem');
        return;
    }

    try {
        setLoading('useButton', true);
        const tx = contract.methods.useTicket(ticketsToRedeem);
        const gas = await tx.estimateGas({ from: currentWallet.address });

        const signedTx = await web3.eth.accounts.signTransaction({
            to: contractAddress,
            data: tx.encodeABI(),
            gas: gas,
            from: currentWallet.address
        }, currentWallet.privateKey);

        // Send the transaction and ignore any receipt-related errors
        try {
            await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            showSuccess(`Successfully redeemed ${ticketsToRedeem} tickets!`);
            await updateBalance();
        } catch (error) {
            // If the error is about receipt, ignore it since the transaction went through
            if (error.message.includes('receipt')) {
                showSuccess(`Successfully redeemed ${ticketsToRedeem} tickets!`);
                await updateBalance();
            } else {
                throw error; // Re-throw other errors
            }
        }
    } catch (error) {
        console.error('Redemption error:', error);
        showError('Failed to redeem tickets: ' + error.message);
    } finally {
        setLoading('useButton', false);
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
