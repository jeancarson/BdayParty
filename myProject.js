const web3 = new Web3("https://holesky.drpc.org");
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

// Create Wallet
$("#createWalletButton").click(function(){
    const password = $("#password").val();
    if(!password) {
        $("#errorMessage").text("Please enter a password");
        $("#errorModal").css("display", "block");
        return;
    }

    const wallet = web3.eth.accounts.create();
    $("#walletAddress").val(wallet.address);
    $("#privateKey").val(wallet.privateKey);
    const keystore = web3.eth.accounts.encrypt(wallet.privateKey, password);
    $("#keystore").val(JSON.stringify(keystore));
});

// Download Keystore
$("#downloadKeystore").click(function(){
    const keystore = $("#keystore").val();
    if(!keystore) {
        $("#errorMessage").text("Please create a wallet first");
        $("#errorModal").css("display", "block");
        return;
    }
    
    const blob = new Blob([keystore], {type: "text/plain"});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wallet.json";
    a.click();
});

// Load Wallet
$("#loadWalletButton").click(function(){
    const password = $("#loadPassword").val();
    const file = $("#keystoreFile")[0].files[0];

    if(!password || !file) {
        $("#errorMessage").text("Please provide password and keystore file");
        $("#errorModal").css("display", "block");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const keystore = e.target.result;
            const wallet = web3.eth.accounts.decrypt(keystore, password);
            $("#walletAddress").val(wallet.address);
            $("#privateKey").val(wallet.privateKey);
            $("#keystore").val(keystore);
        } catch(error) {
            $("#errorMessage").text("Failed to decrypt wallet: " + error.message);
            $("#errorModal").css("display", "block");
        }
    };
    reader.readAsText(file);
});

// Check Balance
$("#checkBalanceButton").click(function(){
    const address = $("#walletAddress").val();
    if(!address) {
        $("#errorMessage").text("Please load or create a wallet first");
        $("#errorModal").css("display", "block");
        return;
    }

    tokenContract.methods.balanceOf(address).call()
        .then(balance => {
            $("#tokenBalance").text("Current Balance: " + web3.utils.fromWei(balance, 'ether') + " ANDY");
        })
        .catch(error => {
            $("#errorMessage").text("Failed to check balance: " + error.message);
            $("#errorModal").css("display", "block");
        });
});

// Send Tokens
$("#sendTokensButton").click(function(){
    const privateKey = $("#privateKey").val();
    const recipient = $("#recipientAddress").val();
    const amount = $("#tokenAmount").val();

    if(!privateKey || !recipient || !amount) {
        $("#errorMessage").text("Please provide all required information");
        $("#errorModal").css("display", "block");
        return;
    }

    const wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
    const amountInWei = web3.utils.toWei(amount, 'ether');
    const tx = {
        from: wallet.address,
        to: tokenAddress,
        gas: 200000,
        data: tokenContract.methods.transfer(recipient, amountInWei).encodeABI()
    };

    web3.eth.accounts.signTransaction(tx, privateKey)
        .then(signedTx => {
            return web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        })
        .then(receipt => {
            $("#transactionRequest").val(JSON.stringify(tx, null, 2));
            $("#transactionResult").val(JSON.stringify(receipt, null, 2));
        })
        .catch(error => {
            $("#errorMessage").text("Transaction failed: " + error.message);
            $("#errorModal").css("display", "block");
        });
});

// Close Modal
$("#closeModal").click(function() {
    $("#errorModal").css("display", "none");
});