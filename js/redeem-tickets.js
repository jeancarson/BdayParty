// Parse and validate number of tickets to redeem
function getValidTicketCount() {
    const value = parseInt(document.getElementById('ticketsToRedeem').value);
    return !isNaN(value) && value > 0 ? value : 0;
}

function validateAndUpdateUI() {
    const ticketCount = getValidTicketCount();
    const useButton = document.getElementById('useButton');
    if (useButton) {
        useButton.disabled = !currentWallet || ticketCount <= 0;
    }
    return ticketCount;
}

async function redeemTickets() {
    if (!currentWallet || !contract) {
        showError('Please load your wallet first');
        return;
    }

    // Prevent multiple transactions while one is pending
    if (isTransactionPending) {
        showError('A transaction is already in progress. Please wait for it to complete.');
        return;
    }

    const ticketsToRedeem = getValidTicketCount();
    if (ticketsToRedeem <= 0) {
        showError('Please enter a valid number of tickets to redeem');
        return;
    }

    try {
        // Check if user has enough tickets to redeem
        const ticketBalance = await contract.methods.balanceOf(currentWallet.address).call();
        if (parseInt(ticketBalance) < ticketsToRedeem) {
            showError(`You don't have enough tickets. Your current balance is ${ticketBalance} tickets.`);
            return;
        }

        setLoading('useButton', true);
        isTransactionPending = true; // Mark transaction as pending
        
        const tx = contract.methods.useTicket(ticketsToRedeem);
        const gas = await tx.estimateGas({ from: currentWallet.address });

        const nonce = await web3.eth.getTransactionCount(currentWallet.address, 'pending');

        const signedTx = await web3.eth.accounts.signTransaction({
            to: contractAddress,
            data: tx.encodeABI(),
            gas: gas,
            from: currentWallet.address,
            nonce: nonce 
        }, currentWallet.privateKey);

        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .on('transactionHash', (hash) => {
                console.log('Transaction hash:', hash);
                showSuccess(`Transaction sent! ${ticketsToRedeem} tickets redeemed. Transaction hash: ${hash}`, 10000);
                
                setTimeout(async () => {
                    try {
                        await updateBalance();
                    } catch (updateError) {
                        console.error('Balance update error:', updateError);
                    } finally {
                        setLoading('useButton', false);
                        isTransactionPending = false; // Reset transaction pending status
                    }
                }, 1000);
            })
            .on('error', (error) => handleRedemptionError(error));
    } catch (error) {
        handleRedemptionError(error, true);
    }
}

function handleRedemptionError(error, isPrepError = false) {
    console.error(isPrepError ? 'Redemption preparation error:' : 'Transaction error:', error);
    
    if (error.message.includes('already known')) {
        showSuccess('Your transaction was already submitted and is being processed.', 10000);
    } else if (error.message.includes('Insufficient tickets')) {
        showError('You do not have enough tickets to redeem. Please check your ticket balance.');
    } else if (error.message.includes('gas required exceeds allowance')) {
        showError('Transaction would exceed gas limits. Try redeeming fewer tickets.');
    } else {
        showError(`Failed to ${isPrepError ? 'prepare' : 'process'} redemption: ${error.message}`);
    }
    
    setLoading('useButton', false);
    isTransactionPending = false;
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

// Handle wallet loaded event
async function handleWalletLoaded(event) {
    currentWallet = event.detail; 
    validateAndUpdateUI();
    
    const useButton = document.getElementById('useButton');
    if (useButton) {
        // Enable button only if user has tickets
        const ticketBalance = await contract.methods.balanceOf(currentWallet.address).call();
        useButton.disabled = ticketBalance <= 0 || getValidTicketCount() <= 0;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    document.addEventListener('walletLoaded', handleWalletLoaded);
    document.getElementById('loadWallet').addEventListener('click', loadWallet);
    document.getElementById('useButton').addEventListener('click', redeemTickets);
    
    const ticketInput = document.getElementById('ticketsToRedeem');
    ticketInput.addEventListener('input', validateAndUpdateUI);
    validateAndUpdateUI();
});
