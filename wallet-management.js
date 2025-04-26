$(document).ready(function() {
    $("#createWalletButton").click(function() {
        const password = $("#password").val();
        if (!password) {
            $("#errorMessage").text("Please enter a password");
            $("#errorModal").css("display", "block");
            return;
        }

        const wallet = web3.eth.accounts.create();
        $("#walletAddress").val(wallet.address);
        $("#privateKey").val(wallet.privateKey);
        const keystore = web3.eth.accounts.encrypt(wallet.privateKey, password);
        $("#keystore").val(JSON.stringify(keystore, null, 2));
        
        // Store wallet data
        storeWalletData(wallet.address, wallet.privateKey);
    });

    $("#downloadKeystore").click(function() {
        const keystore = $("#keystore").val();
        if (!keystore) {
            $("#errorMessage").text("Please create a wallet first");
            $("#errorModal").css("display", "block");
            return;
        }
        
        const blob = new Blob([keystore], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "wallet.json";
        a.click();
    });
});