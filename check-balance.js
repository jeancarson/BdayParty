let contract;
const contractAddress = '0x77481B4bd23Ef04Fbd649133E5955b723863C52D';

async function initWeb3() {
    // Use Holesky RPC if MetaMask is not available
    if (typeof window.ethereum !== 'undefined') {
        // Create new Web3 instance without reassigning the variable
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