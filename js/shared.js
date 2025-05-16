const web3 = new Web3("https://ethereum-holesky.publicnode.com");
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
    },
    {
        "inputs": [
            { "name": "recipient", "type": "address" },
            { "name": "amount", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const contract = new web3.eth.Contract(contractABI, contractAddress);

// Reference to event listener for cleanup
let closeModalListener;

document.addEventListener('DOMContentLoaded', function() {
    // Event listener with reference for later cleanup
    closeModalListener = function() {
        const errorModal = document.getElementById('errorModal');
        if (errorModal) {
            errorModal.style.display = 'none';
        }
    };
    
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModalListener);
    }
    
    // Check web3 connection
    web3.eth.net.isListening()
        .then(() => console.log('Web3 is connected'))
        .catch(err => {
            console.log('Web3 connection error:', err);
            const errorMessage = document.getElementById('errorMessage');
            const errorModal = document.getElementById('errorModal');
            
            if (errorMessage && errorModal) {
                errorMessage.textContent = "Failed to connect to blockchain network";
                errorModal.style.display = 'block';
            }
        });
        
    // cleanup for event listeners when page is unloaded
    window.addEventListener('unload', function() {
        if (closeModalListener) {
            const closeModalBtn = document.getElementById('closeModal');
            if (closeModalBtn) {
                closeModalBtn.removeEventListener('click', closeModalListener);
            }
        }
    });
});

function showError(message) {
    console.error(message);
    
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    
    // Only try to show in the UI if the elements exist
    if (errorModal && errorMessage) {
        errorMessage.textContent = message;
        errorModal.style.display = 'block';
    }
}

function showSuccess(message, duration = 5000) {
    console.log(message); // Always log to console

    const section = document.querySelector('.section');
    if (!section) return;
    
    // Remove any existing success message
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }

    // Create new success message at the bottom of the page/section
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    section.appendChild(successDiv);
    
    // Auto-hide the message after the specified duration
    if (duration > 0) {
        setTimeout(() => {
            if (successDiv && successDiv.parentNode) {
                successDiv.remove();
            }
        }, duration);
    }
}


let currentWallet; 
let keystore;
let isTransactionPending = false;

function setLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
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
            keystore = JSON.parse(e.target.result);
            currentWallet = await web3.eth.accounts.decrypt(keystore, password);
            
            const walletAddressElement = document.getElementById('walletAddress');
            if (walletAddressElement) {
                walletAddressElement.textContent = currentWallet.address;
            }
            
            const balance = await web3.eth.getBalance(currentWallet.address);
            const ethBalanceElement = document.getElementById('ethBalance');
            if (ethBalanceElement) {
                ethBalanceElement.textContent = web3.utils.fromWei(balance, 'ether');
            }
            
            if (contract) {
                const ticketBalance = await contract.methods.balanceOf(currentWallet.address).call();
                const currentTicketsElement = document.getElementById('currentTickets');
                if (currentTicketsElement) {
                    currentTicketsElement.textContent = ticketBalance;
                }
            }

            // Trigger a custom event that pages can listen for
            const event = new CustomEvent('walletLoaded', { detail: currentWallet });
            document.dispatchEvent(event);
            
            return currentWallet;
        } catch (error) {
            showError('Failed to decrypt wallet: ' + error.message);
        } finally {
            setLoading('loadWallet', false);
        }
    };
    reader.readAsText(fileInput.files[0]);
}
// global variables
window.web3 = web3;
window.contract = contract;
window.setLoading = setLoading;
window.loadWallet = loadWallet;