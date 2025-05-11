const web3 = new Web3("https://ethereum-holesky.publicnode.com");
const tokenAddress = "0x1FDCAFCA56B606F4bF89D29b64673a43c15AF38A";

const tokenABI = [
    {
        "constant": true,
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "recipient", "type": "address"},
            {"name": "amount", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);

// Error modal handling
$(document).ready(function() {
    $("#closeModal").click(function() {
        $("#errorModal").css("display", "none");
    });
});

// Store wallet data in localStorage
function storeWalletData(address, privateKey) {
    localStorage.setItem('walletAddress', address);
    localStorage.setItem('privateKey', privateKey);
}

// Get wallet data from localStorage
function getWalletData() {
    return {
        address: localStorage.getItem('walletAddress'),
        privateKey: localStorage.getItem('privateKey')
    };
}

// Check web3 connection
web3.eth.net.isListening()
    .then(() => console.log('Web3 is connected'))
    .catch(err => {
        console.log('Web3 connection error:', err);
        $("#errorMessage").text("Failed to connect to blockchain network");
        $("#errorModal").css("display", "block");
    });

// Error handling
function showError(message) {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorModal.style.display = 'block';
}

function showSuccess(message, duration = 5000) {
    // Remove any existing success message
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }

    // Create and show new success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Insert after the last form in the section
    const section = document.querySelector('.section');
    section.appendChild(successDiv);
    
    // Auto-hide after specified duration
    setTimeout(() => {
        successDiv.remove();
    }, duration);
}

// Wallet utilities
function downloadKeystore(keystore, address) {
    const element = document.createElement('a');
    const keystoreBlob = new Blob([JSON.stringify(keystore, null, 2)], { type: 'text/json' });
    element.href = URL.createObjectURL(keystoreBlob);
    element.download = `UTC--${new Date().toISOString()}--${address}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Contract utilities
function getContractABI() {
    return [
        // ERC20 standard functions
        "function balanceOf(address account) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        
        // Custom ticket functions
        "function ticketPrice() view returns (uint256)",
        "function vendor() view returns (address)",
        "function buyTickets(uint256 numberOfTickets) payable",
        "function useTicket(uint256 numberOfTickets)",
        
        // Events
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event Approval(address indexed owner, address indexed spender, uint256 value)",
        "event TicketPurchased(address indexed buyer, uint256 amount)",
        "event TicketRefunded(address indexed holder, uint256 amount)"
    ];
}

// Format utilities
function formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function formatEther(wei) {
    if (!wei) return '0';
    return parseFloat(web3.utils.fromWei(wei, 'ether')).toFixed(6);
}

// Network utilities
async function getNetworkInfo() {
    try {
        const networkId = await web3.eth.net.getId();
        const networkType = await web3.eth.net.getNetworkType();
        return {
            id: networkId,
            type: networkType,
            name: getNetworkName(networkId)
        };
    } catch (error) {
        console.error('Error getting network info:', error);
        return null;
    }
}

function getNetworkName(networkId) {
    const networks = {
        1: 'Ethereum Mainnet',
        3: 'Ropsten Testnet',
        4: 'Rinkeby Testnet',
        5: 'Goerli Testnet',
        42: 'Kovan Testnet',
        11155111: 'Sepolia Testnet'
    };
    return networks[networkId] || 'Unknown Network';
}

// Export utilities if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showError,
        showSuccess,
        downloadKeystore,
        getContractABI,
        formatAddress,
        formatEther,
        getNetworkInfo,
        getNetworkName
    };
}