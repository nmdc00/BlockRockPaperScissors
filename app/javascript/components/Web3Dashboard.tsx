import React, { useState } from "react";
import { ethers } from "ethers";
import contractABI from "../contractABI.json"; // Adjust path as needed

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS; // Assuming this is in your .env

const Web3Dashboard: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [gameCounter, setGameCounter] = useState<string | null>(null);
  
  // Connect Wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is required to connect!");
      return;
    }

    if (!CONTRACT_ADDRESS) {
      alert("Contract address is not configured!");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    setWalletAddress(address);

    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
    const counter = await contract.gameCounter();
    setGameCounter(counter.toString());
  };

  return (
    <div>
      <h1>Web3 Dashboard</h1>
      <button onClick={connectWallet}>Connect Wallet</button>
      {walletAddress && <p>Wallet Address: {walletAddress}</p>}
      {gameCounter && <p>Game Counter: {gameCounter}</p>}
    </div>
  );
};

export default Web3Dashboard;
