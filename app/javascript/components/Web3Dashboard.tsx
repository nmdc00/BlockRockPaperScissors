import React, { useState, useEffect } from "react";
import { connectWallet, disconnectWallet } from "./wallet";
import { hasPlayerJoined, joinGame, getPlayerCount} from "./contractService";
import { ethers } from "ethers";

interface Web3DashboardProps {
  contractAddress: string;
}

const Web3Dashboard: React.FC<Web3DashboardProps> = ({ contractAddress }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [gameId, setGameId] = useState<number>(1);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [hasJoined, setHasJoined] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);

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
      // Fetch player count after joining
      const count = await getPlayerCount(provider, gameId);
      if (count >= 2) {
        setStatusMessage("Game is already full. Try another game.");
        return;
      }

      await joinGame(gameId, signer);
      setStatusMessage(`Joined game #${gameId} successfully!`);

      setPlayerCount(count + 1);
      setHasJoined(true)
    } catch (error) {
      console.error("Error joining the game:", error);
      setStatusMessage(`Failed to join the game with Id#${gameId}.`);
    }
  };

  //Fetch player count when gameID changes
  useEffect(() => {
    const fetchPlayerCount = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const count = await getPlayerCount(provider, gameId);
        setPlayerCount(count);
      } catch (error) {
        console.error("Error fetching player count:", error);
      }
    };
  
    fetchPlayerCount(); // Fetch once immediately
    const interval = setInterval(fetchPlayerCount, 2000); // Fetch every 2 seconds
  
    return () => clearInterval(interval); // Clean up on unmount
  }, [gameId]); //

  useEffect(() => {
    const checkIfPlayerJoined = async () => {
      try {
        if (!walletAddress) return;

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        const isJoined = await hasPlayerJoined(provider, gameId, address);
        setHasJoined(isJoined);
      } catch (error) {
        console.error("Error checking player status:", error);
      }
    };

    checkIfPlayerJoined();
  }, [gameId, walletAddress]); // Runs when `gameId` or `walletAddress` changes

  return (
    <div>
      <h1>Block Paper Scissors</h1>
  
      {walletAddress ? (
        <>
          <p>Wallet Connected: {walletAddress}</p>
          <button onClick={disconnectWallet}>Disconnect</button>
        </>
      ) : (
        <button onClick={handleConnectWallet}>Connect Wallet</button>
      )}
  
      {/* Only show this section if the wallet is connected */}
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
          
          {!hasJoined ? (
            <button onClick={handleJoinGame}>Join Game</button>
          ) : playerCount === 1 ? (
            <p>Waiting for another player to join...</p>
          ) : (
            <p>Game is ready! You can now make your move.</p>
          )}
  
          {statusMessage && <p>{statusMessage}</p>}
        </div>
      )}
    </div>
  );
}
  
export default Web3Dashboard;
