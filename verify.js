
class TokenVerifier {
    constructor() {
        this.connection = new solanaWeb3.Connection(
            'https://mainnet.helius-rpc.com/?api-key=f220866e-b5d1-4140-a2d5-f48fcd1a506a',
            'confirmed'
        );
        this.TOKEN_ADDRESS = '5rXSxYoRxASFrALkhHX2PG4D96J8L24c7DB3qEzRpump';
        this.TOKEN_THRESHOLD = 100000;
        this.initialize();
    }

    async initialize() {
        // Check if already verified
        if (sessionStorage.getItem('tokenVerified') === 'true') {
            document.getElementById('verification-section').classList.add('hidden');
            document.getElementById('content-section').classList.remove('hidden');
            return;
        }

        this.connectButton = document.getElementById('connect-button');
        this.balanceDisplay = document.getElementById('balance-display');
        this.checkTokenButton = document.getElementById('check-token');

        this.connectButton.addEventListener('click', () => this.connectWallet());
        this.checkTokenButton.addEventListener('click', () => this.verifyTokens());

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
            await this.getInfopunksBalance();
        } catch (err) {
            console.error('Error connecting to wallet:', err);
        }
    }

    async getInfopunksBalance() {
        try {
            const tokenPublicKey = new solanaWeb3.PublicKey(this.TOKEN_ADDRESS);
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
                this.publicKey,
                { mint: tokenPublicKey }
            );

            let totalBalance = 0;
            tokenAccounts.value.forEach((accountInfo) => {
                const tokenBalance = accountInfo.account.data.parsed.info.tokenAmount;
                totalBalance += parseInt(tokenBalance.amount) / Math.pow(10, tokenBalance.decimals);
            });

            this.currentBalance = totalBalance;
            this.balanceDisplay.textContent = `$INFOPUNKS Balance: ${totalBalance.toLocaleString()}`;
        } catch (err) {
            console.error('Error getting INFOPUNKS balance:', err);
            this.balanceDisplay.textContent = 'Error getting $INFOPUNKS balance';
        }
    }

    async verifyTokens() {
        try {
            if (!this.publicKey) {
                alert('Please connect your wallet first!');
                return;
            }

            if (this.currentBalance >= this.TOKEN_THRESHOLD) {
                // Store verification in session
                sessionStorage.setItem('tokenVerified', 'true');
                sessionStorage.setItem('walletAddress', this.publicKey.toString());
                
                // Show content section and hide verification section
                document.getElementById('verification-section').classList.add('hidden');
                document.getElementById('content-section').classList.remove('hidden');
            } else {
                alert(`Access denied. You need at least ${this.TOKEN_THRESHOLD.toLocaleString()} tokens to proceed.`);
            }
        } catch (err) {
            console.error('Verification error:', err);
            alert('Error during verification. Please try again.');
        }
    }
}

// Initialize the verifier when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TokenVerifier();
});
