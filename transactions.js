$(document).ready(function() {
    const walletData = getWalletData();
    if (walletData.address) {
        $("#currentWalletAddress").text(walletData.address);
        loadTransactions();
    }

    $("#refreshTransactions").click(loadTransactions);
    $("#transactionType").change(filterTransactions);

    function loadTransactions() {
        const walletData = getWalletData();
        if (!walletData.address) {
            $("#errorMessage").text("Please load your wallet first");
            $("#errorModal").css("display", "block");
            return;
        }

        // Clear existing transactions
        $("#transactionList").empty();
        
        // Add loading indicator
        $("#transactionList").append('<p>Loading transactions...</p>');

        // Get transfer events where wallet is sender or receiver
        tokenContract.getPastEvents('Transfer', {
            filter: {
                $or: [
                    { from: walletData.address },
                    { to: walletData.address }
                ]
            },
            fromBlock: 0,
            toBlock: 'latest'
        })
        .then(events => {
            $("#transactionList").empty();
            if (events.length === 0) {
                $("#transactionList").append('<p>No transactions found</p>');
                return;
            }

            events.forEach(event => {
                const isSent = event.returnValues.from.toLowerCase() === walletData.address.toLowerCase();
                const transactionHtml = `
                    <div class="transaction-item ${isSent ? 'sent' : 'received'}" 
                         data-tx-hash="${event.transactionHash}">
                        <div class="transaction-type">${isSent ? 'Sent' : 'Received'}</div>
                        <div class="transaction-amount">
                            ${web3.utils.fromWei(event.returnValues.value, 'ether')} ANDY
                        </div>
                        <div class="transaction-address">
                            ${isSent ? 'To: ' : 'From: '}
                            ${isSent ? event.returnValues.to : event.returnValues.from}
                        </div>
                    </div>
                `;
                $("#transactionList").append(transactionHtml);
            });

            // Add click handler for transaction items
            $(".transaction-item").click(function() {
                const txHash = $(this).data('tx-hash');
                showTransactionDetails(txHash);
            });
        })
        .catch(error => {
            $("#errorMessage").text("Error loading transactions: " + error.message);
            $("#errorModal").css("display", "block");
        });
    }

    function filterTransactions() {
        const filterType = $("#transactionType").val();
        $(".transaction-item").show();
        if (filterType !== 'all') {
            $(".transaction-item").not('.' + filterType).hide();
        }
    }

    function showTransactionDetails(txHash) {
        web3.eth.getTransaction(txHash)
            .then(transaction => {
                $("#transactionDetails").val(JSON.stringify(transaction, null, 2));
            })
            .catch(error => {
                $("#errorMessage").text("Error loading transaction details: " + error.message);
                $("#errorModal").css("display", "block");
            });
    }
});