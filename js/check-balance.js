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

// Handle wallet loaded event
async function handleWalletLoaded(event) {
    currentWallet = event.detail; 
    document.getElementById('walletAddress').textContent = currentWallet.address;
    const balance = await web3.eth.getBalance(currentWallet.address);
    document.getElementById('ethBalance').textContent = web3.utils.fromWei(balance, 'ether');
    if (contractAddress) {
        const ticketBalance = await contract.methods.balanceOf(currentWallet.address).call();
        document.getElementById('ticketBalance').textContent = ticketBalance;
    }
    displayKeystoreDetails(keystore);


}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {    
    document.addEventListener('walletLoaded', handleWalletLoaded);
    document.getElementById('loadWallet').addEventListener('click', loadWallet);
    document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('errorModal').style.display = 'none';
    });
});