import React, { useState, useEffect } from "react";
import { connectWallet } from "./wallet";
import { getPlayerCount, joinGame, listenForGameReady } from "./contractService";
import { ethers } from "ethers";

// Define the props interface
interface Web3DashboardProps {
  contractAddress: string;
}

const Web3Dashboard: React.FC<Web3DashboardProps> = ({ contractAddress }) => {
  const [isGameReady, setIsGameReady] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [gameId, setGameId] = useState<number>(1);
  
  // Join the game
  const handleJoinGame = async () => {
    try {
      const signer = await connectWallet();
      if (!signer) return;

      await joinGame(signer);
      alert("Successfully joined the game!");
    } catch (error) {
      console.error("Error joining the game:", error);
      alert("Failed to join the game. Check the console for details.");
    }
  };

  // Fetch the player count
  const fetchPlayerCount = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const count = await getPlayerCount(provider, gameId);
      setPlayerCount(count);
      console.log("Player count (type):", typeof count, count);
    } catch (error) {
      console.error("Error fetching player count:", error);
    }
  };

  useEffect(() => {
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Listen for the GameReady event
    listenForGameReady(provider, (player1, player2) => {
      console.log("Game is ready! Players:", player1, player2);
      setIsGameReady(true);
      alert(`Game is ready! Player 1: ${player1}, Player 2: ${player2}`);
    });

    // Fetch player count on mount
    fetchPlayerCount();

    return () => {
      // Clean up event listeners when the component unmounts
      provider.removeAllListeners();
    };
  }, []);

  return (
    <div>
      <h1>Rock Paper Scissors - Web3 Edition</h1>

      {!isGameReady ? (
        <div>
          <p>Player Count: {playerCount}/2</p>
          <button onClick={handleJoinGame}>Join Game</button>
        </div>
      ) : (
        <div>
          <h2>The game is ready!</h2>
          <p>Now you can make your moves!</p>
          {/* Add move submission buttons here */}
        </div>
      )}
    </div>
  );
};

export default Web3Dashboard;
