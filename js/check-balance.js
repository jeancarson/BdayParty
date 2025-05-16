function displayKeystoreDetails(keystore) {
    const keystoreInfo = document.getElementById('keystoreInfo');
    keystoreInfo.innerHTML = '';

    //CSS class for indentation
    keystoreInfo.classList.add('keystore-info');

    // Display main keystore properties
    for (const [key, value] of Object.entries(keystore)) {
        if (key !== 'crypto' && key !== 'Crypto') {
            const detail = document.createElement('p');
            detail.className = 'keystore-item';
            detail.innerHTML = `<strong>${key}:</strong> ${value}`;
            keystoreInfo.appendChild(detail);
        }
    }

    // Display crypto details with indentation
    const cryptoObj = keystore.crypto || keystore.Crypto;
    if (cryptoObj) {
        const cryptoDetails = document.createElement('div');
        cryptoDetails.className = 'crypto-details';
        cryptoDetails.innerHTML = '<h4>Encryption Details:</h4>';
        
        for (const [key, value] of Object.entries(cryptoObj)) {
            if (typeof value === 'object') {
                const section = document.createElement('div');
                section.className = 'crypto-section';
                section.innerHTML = `<p class="crypto-header"><strong>${key}:</strong></p>`;
                
                for (const [subKey, subValue] of Object.entries(value)) {
                    const subDetail = document.createElement('p');
                    subDetail.className = 'crypto-sub-item';
                    subDetail.innerHTML = `<strong>${subKey}:</strong> ${subValue}`;
                    section.appendChild(subDetail);
                }
                cryptoDetails.appendChild(section);
            } else {
                const detail = document.createElement('p');
                detail.className = 'crypto-item';
                detail.innerHTML = `<strong>${key}:</strong> ${value}`;
                cryptoDetails.appendChild(detail);
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