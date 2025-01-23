import React, { useState, useEffect  } from "react";
import { ethers, BrowserProvider } from "ethers";
const CONTRACT_ABI = require("../contractABI.json"); // Adjust path as needed

console.log("Contract ABI:", CONTRACT_ABI);

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS; // Assuming this is in your .env

const Web3Dashboard: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [gameCounter, setGameCounter] = useState<string | null>(null);
  console.log("React is mounting...");

  useEffect(() => {
    console.log("Web3Dashboard mounted");
    console.log("Contract Address:", CONTRACT_ADDRESS);
    console.log("Contract ABI:", CONTRACT_ABI);
  }, []);

  const connectWallet = async () => {
    console.log("Connecting wallet...");
    if (!window.ethereum) {
      alert("MetaMask is required to connect!");
      return;
    }

    if (!CONTRACT_ADDRESS) {
      alert("Contract address is not configured!");
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const counter = await contract.gameCounter();
      setGameCounter(counter.toString());
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
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