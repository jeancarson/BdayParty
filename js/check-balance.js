let contract;
const contractAddress = '0x77481B4bd23Ef04Fbd649133E5955b723863C52D';

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
            const keystore = JSON.parse(e.target.result);
            const wallet = await web3.eth.accounts.decrypt(keystore, password);
            
            // Display wallet address
            document.getElementById('walletAddress').textContent = wallet.address;
            
            // Display network info
            const networkId = await web3.eth.net.getId();
            const networkType = await web3.eth.net.getNetworkType();
            document.getElementById('network').textContent = `${networkType} (${networkId})`;
            
            // Get and display ETH balance
            const balance = await web3.eth.getBalance(wallet.address);
            document.getElementById('ethBalance').textContent = web3.utils.fromWei(balance, 'ether');
            
            // Get and display ticket balance if contract is deployed
            if (contractAddress) {
                const ticketBalance = await contract.methods.balanceOf(wallet.address).call();
                document.getElementById('ticketBalance').textContent = ticketBalance;
            }
            
            // Display full keystore details
            displayKeystoreDetails(keystore);
        } catch (error) {
            showError('Failed to decrypt wallet: ' + error.message);
        } finally {
            setLoading('loadWallet', false);
        }
    };
    reader.readAsText(fileInput.files[0]);
}

function displayKeystoreDetails(keystore) {
    const keystoreInfo = document.getElementById('keystoreInfo');
    keystoreInfo.innerHTML = '';

    // Create a formatted display of all keystore properties
    for (const [key, value] of Object.entries(keystore)) {
        if (key !== 'crypto' && key !== 'Crypto') {
            const detail = document.createElement('p');
            detail.innerHTML = `<strong>${key}:</strong> ${value}`;
            keystoreInfo.appendChild(detail);
        }
    }

    // Display crypto details separately
    const cryptoObj = keystore.crypto || keystore.Crypto;
    if (cryptoObj) {
        const cryptoDetails = document.createElement('div');
        cryptoDetails.innerHTML = '<h4>Encryption Details:</h4>';
        
        for (const [key, value] of Object.entries(cryptoObj)) {
            if (typeof value === 'object') {
                cryptoDetails.innerHTML += `<p><strong>${key}:</strong></p>`;
                for (const [subKey, subValue] of Object.entries(value)) {
                    cryptoDetails.innerHTML += `<p class="sub-detail"><strong>${subKey}:</strong> ${subValue}</p>`;
                }
            } else {
                cryptoDetails.innerHTML += `<p><strong>${key}:</strong> ${value}</p>`;
            }
        }
        keystoreInfo.appendChild(cryptoDetails);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await initWeb3();
    
    // Initialize contract with ABI
    const contractABI = [
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
        }
        // Add other ABI elements as needed
    ];
    
    contract = new web3.eth.Contract(contractABI, contractAddress);
    
    document.getElementById('loadWallet').addEventListener('click', loadWallet);
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('errorModal').style.display = 'none';
    });
});