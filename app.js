class PhantomWalletChecker {
    constructor() {
        this.connection = new solanaWeb3.Connection(
            'https://mainnet.helius-rpc.com/?api-key=f220866e-b5d1-4140-a2d5-f48fcd1a506a',
            'confirmed'
        );
        this.TOKEN_THRESHOLD = 100000;
        this.initialize();
    }

    async initialize() {
        this.connectButton = document.getElementById('connect-button');
        this.balanceDisplay = document.getElementById('balance-display');
        this.checkTokenButton = document.getElementById('check-token');

        this.connectButton.addEventListener('click', () => this.connectWallet());
        this.checkTokenButton.addEventListener('click', () => this.checkTokenBalance());

        // Check if Phantom is installed
        if ("solana" in window) {
            this.provider = window.solana;
            if (this.provider.isPhantom) {
                this.connectButton.disabled = false;
            }
        } else {
            this.balanceDisplay.innerHTML = 'Phantom wallet is not installed. Please install it from <a href="https://phantom.app/" target="_blank">phantom.app</a>';
            this.connectButton.disabled = true;
        }
    }

    async connectWallet() {
        try {
            const resp = await this.provider.connect();
            this.publicKey = resp.publicKey;
            this.connectButton.textContent = 'Connected!';
            await this.getBalance();
        } catch (err) {
            console.error('Error connecting to wallet:', err);
        }
    }

    async getBalance() {
        try {
            const balance = await this.connection.getBalance(this.publicKey);
            this.balanceDisplay.textContent = `Balance: ${balance / solanaWeb3.LAMPORTS_PER_SOL} SOL`;
        } catch (err) {
            console.error('Error getting balance:', err);
        }
    }

    async checkTokenBalance() {
        const tokenAddress = document.getElementById('token-address').value;

        if (!tokenAddress) {
            alert('Please enter the token address');
            return;
        }

        try {
            console.log("Checking balance for token:", tokenAddress);
            console.log("Connected wallet:", this.publicKey?.toString());
            
            if (!this.publicKey) {
                alert('Please connect your wallet first!');
                return;
            }

            const tokenPublicKey = new solanaWeb3.PublicKey(tokenAddress);
            console.log("Getting token accounts...");
            
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
                this.publicKey,
                { mint: tokenPublicKey }
            );

            console.log("Token accounts found:", tokenAccounts.value.length);

            let totalBalance = 0;
            tokenAccounts.value.forEach((accountInfo) => {
                const tokenBalance = accountInfo.account.data.parsed.info.tokenAmount;
                totalBalance += parseInt(tokenBalance.amount) / Math.pow(10, tokenBalance.decimals);
            });

            console.log("Total balance:", totalBalance);
            console.log("Required threshold:", this.TOKEN_THRESHOLD);

            if (totalBalance >= this.TOKEN_THRESHOLD) {
                window.location.href = '/hello.html';
            } else {
                alert(`Access denied. You need at least ${this.TOKEN_THRESHOLD.toLocaleString()} tokens to proceed.`);
            }
        } catch (err) {
            console.error('Detailed error:', err);
            
            // More specific error messages
            if (err.message.includes('Invalid public key input')) {
                alert('Invalid token address. Please check the address and try again.');
            } else if (err.message.includes('Network request failed')) {
                alert('Network error. Please check your connection and try again.');
            } else {
                alert(`Error: ${err.message}`);
            }
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PhantomWalletChecker();
});