document.addEventListener("DOMContentLoaded", function() {
    // Create Wallet
    document.getElementById("createWalletButton").addEventListener("click", function() {
        const password = document.getElementById("password").value;
        if (!password) {
            showError("Please enter a password");
            return;
        }

        try {
            const wallet = web3.eth.accounts.create();
            document.getElementById("walletAddress").value = wallet.address;
            document.getElementById("privateKey").value = wallet.privateKey;
            const keystore = web3.eth.accounts.encrypt(wallet.privateKey, password);
            document.getElementById("keystore").value = JSON.stringify(keystore, null, 2);
            
            showSuccess("Wallet created successfully!");
        } catch (error) {
            showError("Failed to create wallet: " + error.message);
        }
    });

    // Download Keystore
    document.getElementById("downloadKeystore").addEventListener("click", function() {
        const keystore = document.getElementById("keystore").value;
        if (!keystore) {
            showError("Please create a wallet first");
            return;
        }
        
        try {
            const blob = new Blob([keystore], { type: "text/plain" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "wallet.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            showSuccess("Keystore downloaded successfully!");
        } catch (error) {
            showError("Failed to download keystore: " + error.message);
        }
    });

    document.getElementById("closeModal").addEventListener("click", function() {
        document.getElementById("errorModal").style.display = "none";
    });
});
