async function updateEventInfo() {
    if (!contract) return;

    try {
        // Get ticket price
        const price = await contract.methods.ticketPrice().call();
        document.getElementById('ticketPrice').textContent = web3.utils.fromWei(price, 'ether');

        // Get number of available tickets
        const vendorAddress = await contract.methods.vendor().call();
        const availableTickets = await contract.methods.balanceOf(vendorAddress).call();
        document.getElementById('availableTickets').textContent = availableTickets;

        updateTotalCost();
    } catch (error) {
        showError('Failed to fetch event information: ' + error.message);
    }
}

function handleTransactionError(error, isPrepError = false) {
    console.error(isPrepError ? 'Purchase preparation error:' : 'Transaction error:', error);
    
    if (error.message.includes('already known')) {
        showSuccess('Your transaction was already submitted and is being processed.');
    } else if (error.message.includes('insufficient funds')) {
        showError('You do not have enough ETH to complete this purchase.');
    } else if (error.message.includes('Not enough tickets available')) {
        showError('There are not enough tickets available for purchase.');
    } else if (error.message.includes('gas required exceeds allowance')) {
        showError('Transaction would exceed gas limits. Try purchasing fewer tickets.');
    } else {
        showError(`Failed to ${isPrepError ? 'prepare' : 'process'} transaction: ${error.message}`);
    }

    setLoading('purchaseButton', false);
    isTransactionPending = false;
}

//basically multiply the ticket price by the number of tickets being bought
function updateTotalCost() {
    const ticketPrice = parseFloat(document.getElementById('ticketPrice').textContent);
    const numberOfTickets = parseInt(document.getElementById('numberOfTickets').value);
    const totalCost = ticketPrice * numberOfTickets;
    document.getElementById('totalCost').textContent = totalCost.toFixed(6);
}

//enable the purchase button only after the wallet is loaded
async function handleWalletLoaded(event) {
    currentWallet = event.detail; // Store the wallet locally
    
    const purchaseButton = document.getElementById('purchaseButton');
    if (purchaseButton) {
        purchaseButton.disabled = false;
    }
    
    // Update page after wallet is loaded
    await updateEventInfo();
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
        isTransactionPending = true;
        
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
            gas: Math.floor(gas * 1.2), // 20 percent gas buffer
            value: totalCost,
            from: currentWallet.address,
            nonce: nonce
        }, currentWallet.privateKey);

        //send transaction
        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .on('transactionHash', async (hash) => {
                console.log('Transaction hash:', hash);
                showSuccess('Transaction sent! Transaction hash: ' + hash);
                
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
                    isTransactionPending = false;
                }
            })
            .on('error', (error) => handleTransactionError(error));
    } catch (error) {
        handleTransactionError(error, true);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await updateEventInfo();
    } catch (error) {
        console.log('Initial contract data fetch failed, will retry on user interaction');
    }
    document.addEventListener('walletLoaded', handleWalletLoaded);
    document.getElementById('loadWallet').addEventListener('click', loadWallet);
    document.getElementById('numberOfTickets').addEventListener('input', updateTotalCost);
    document.getElementById('purchaseButton').addEventListener('click', purchaseTickets);
});