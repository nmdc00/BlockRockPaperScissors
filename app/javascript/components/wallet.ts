import { ethers, BrowserProvider } from "ethers";

// Force wallet disconnect on page load
window.addEventListener("load", () => {
    localStorage.removeItem("walletAddress"); // Clear stored wallet
});

export const connectWallet = async (): Promise<ethers.Signer | null> => {
    if (!window.ethereum) {
        alert("MetaMask is required to connect!");
        return null;
    }

    try {
			const provider = new BrowserProvider(window.ethereum);
			await provider.send("eth_requestAccounts", []); // Request access to the user's wallet
			const signer = await provider.getSigner();
			
			if (!signer) {
				console.error("Failed to get signer from provider.");
				return null; // ✅ Explicitly return null if signer isn't available
			}
	
			return signer; // ✅ Return the signer if everything is successful
		} catch (error) {
			console.error("Error connecting wallet:", error);
			return null; // ✅ Ensure function always returns a value
		}
	};

// Function to check if wallet is already connected
export const getWalletAddress = (): string | null => {
    return localStorage.getItem("walletAddress");
};

// Function to disconnect wallet manually
export const disconnectWallet = () => {
    localStorage.removeItem("walletAddress");
    window.location.reload(); // Refresh page to clear connection
};
