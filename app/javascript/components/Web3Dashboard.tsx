import React, { useState, useEffect } from "react";
import { connectWallet, disconnectWallet } from "./wallet";
import { joinGame } from "./contractService";
import { ethers } from "ethers";

interface Web3DashboardProps {
  contractAddress: string;
}

const Web3Dashboard: React.FC<Web3DashboardProps> = ({ contractAddress }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [gameId, setGameId] = useState<number>(1);
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    setWalletAddress(null); // Ensure it resets on refresh
  }, []);

  const handleConnectWallet = async () => {
    const signer = await connectWallet();
    if (signer) {
      setWalletAddress(await signer.getAddress());
    }
  };

  const handleJoinGame = async () => {
    if (!walletAddress) {
      setStatusMessage("Please connect your wallet first.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      await joinGame(gameId, signer);
      setStatusMessage(`Joined game #${gameId} successfully!`);
    } catch (error) {
      console.error("Error joining the game:", error);
      setStatusMessage("Failed to join the game.");
    }
  };

  return (
    <div>
      <h1>Rock Paper Scissors - Web3 Edition</h1>
      
      {walletAddress ? (
        <>
          <p>Wallet Connected: {walletAddress}</p>
          <button onClick={disconnectWallet}>Disconnect</button>
        </>
      ) : (
        <button onClick={handleConnectWallet}>Connect Wallet</button>
      )}

      {/* Only show this section if wallet is connected */}
      {walletAddress && (
        <div>
          <label htmlFor="gameId">Game ID:</label>
          <input
            type="number"
            id="gameId"
            value={gameId}
            onChange={(e) => setGameId(Number(e.target.value))}
            min={1}
          />
          <button onClick={handleJoinGame}>Join Game</button>
        </div>
      )}

      {statusMessage && <p>{statusMessage}</p>}
    </div>
  );
};

export default Web3Dashboard; // ✅ Ensure this export is present!
