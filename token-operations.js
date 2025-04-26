$(document).ready(function() {
    $("#checkBalanceButton").click(function() {
        const walletData = getWalletData();
        if (!walletData.address) {
            $("#errorMessage").text("Please load your wallet first");
            $("#errorModal").css("display", "block");
            return;
        }

        tokenContract.methods.balanceOf(walletData.address).call()
            .then(balance => {
                $("#tokenBalance").text("Current Balance: " + 
                    web3.utils.fromWei(balance, 'ether') + " ANDY");
            })
            .catch(error => {
                $("#errorMessage").text("Error checking balance: " + error.message);
                $("#errorModal").css("display", "block");
            });
    });

    $("#sendTokensButton").click(function() {
        const walletData = getWalletData();
        const recipient = $("#recipientAddress").val();
        const amount = $("#tokenAmount").val();

        if (!walletData.privateKey) {
            $("#errorMessage").text("Please load your wallet first");
            $("#errorModal").css("display", "block");
            return;
        }

        if (!recipient || !amount) {
            $("#errorMessage").text("Please enter recipient address and amount");
            $("#errorModal").css("display", "block");
            return;
        }

        const amountInWei = web3.utils.toWei(amount, 'ether');
        const tx = {
            from: walletData.address,
            to: tokenAddress,
            gas: 200000,
            data: tokenContract.methods.transfer(recipient, amountInWei).encodeABI()
        };

        web3.eth.accounts.signTransaction(tx, walletData.privateKey)
            .then(signedTx => {
                return web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            })
            .then(receipt => {
                $("#errorMessage").text("Transaction successful!");
                $("#errorModal").css("display", "block");
            })
            .catch(error => {
                $("#errorMessage").text("Transaction failed: " + error.message);
                $("#errorModal").css("display", "block");
            });
    });
});