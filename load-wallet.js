$(document).ready(function() {
    $("#loadWalletButton").click(function() {
        const password = $("#loadPassword").val();
        const file = $("#keystoreFile")[0].files[0];

        if (!password || !file) {
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
                storeWalletData(wallet.address, wallet.privateKey);
            } catch (error) {
                $("#errorMessage").text("Failed to decrypt wallet: " + error.message);
                $("#errorModal").css("display", "block");
            }
        };
        reader.readAsText(file);
    });
});