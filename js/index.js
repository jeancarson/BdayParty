// Wallet creation and management for index.html
$(document).ready(function() {
    // Create Wallet
    $("#createWalletButton").click(function() {
        const password = $("#password").val();
        if (!password) {
            showError("Please enter a password");
            return;
        }

        try {
            const wallet = web3.eth.accounts.create();
            $("#walletAddress").val(wallet.address);
            $("#privateKey").val(wallet.privateKey);
            const keystore = web3.eth.accounts.encrypt(wallet.privateKey, password);
            $("#keystore").val(JSON.stringify(keystore, null, 2));
            
            showSuccess("Wallet created successfully!");
        } catch (error) {
            showError("Failed to create wallet: " + error.message);
        }
    });

    // Download Keystore
    $("#downloadKeystore").click(function() {
        const keystore = $("#keystore").val();
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

    // Close Modal (moved to shared.js)
    $("#closeModal").click(function() {
        $("#errorModal").css("display", "none");
    });
}); 