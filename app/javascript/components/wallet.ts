import { ethers } from "ethers";

export const connectWallet = async (): Promise<ethers.Signer | null> => {
  if (!window.ethereum) {
    alert("MetaMask is required to connect!");
    return null;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
};