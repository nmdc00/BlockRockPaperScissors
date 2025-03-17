import React, { useState, useEffect } from "react";
import { connectWallet, disconnectWallet } from "./wallet";
import { hasPlayerJoined, joinGame, getPlayerCount, commitMove, revealMove, leaveGame, getContract, getGameState} from "./contractService";
import { ethers, keccak256, toUtf8Bytes } from "ethers";
import styles from '../components/Web3Dashboard.module.css';

interface Web3DashboardProps {
  contractAddress: string;
}

const Web3Dashboard: React.FC<Web3DashboardProps> = ({ contractAddress }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [gameId, setGameId] = useState<number>(1);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [hasJoined, setHasJoined] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [secret, setSecret] = useState<string>("");
  const [move, setMove] = useState<number>(0);
  const [commitHash, setCommitHash] = useState<string>("");
  const [betAmount, setBetAmount] = useState<string>("0.01");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [gameStatus, setGameStatus] = useState<number>(0); // Game status (WaitingForPlayers, MovesCommitted, etc.)
  const [playersCommitted, setPlayersCommitted] = useState<boolean>(false); // Whether both players committed


  useEffect(() => {
    setWalletAddress(null); // Ensure it resets on refresh
  }, []);
  
  const resetIdleTimer = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const newTimeout = setTimeout(() => handleLeaveGame(), 2 * 60 * 1000);
    setTimeoutId(newTimeout)
  }

  const handleUserAction = () => {
    resetIdleTimer();
  };

  const handleConnectWallet = async () => {
    const signer = await connectWallet();
    if (signer) {
      setWalletAddress(await signer.getAddress());
    }
  };

  useEffect(() => {
    const savedSecret = sessionStorage.getItem(`secret-game-${gameId}`);
    if (savedSecret) {
      setSecret(savedSecret);
    }
  }, [gameId]);

  const handleJoinGame = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    if (!walletAddress) {
      setStatusMessage("Please connect your wallet first.");
      return;
    }

    try {
      // Fetch player count after joining
      const count = await getPlayerCount(provider, gameId);
      if (count === 0) {
        await joinGame(gameId, signer, betAmount);
      } else {
        await joinGame(gameId, signer)
      }

      //Generate secret on joining
      const generatedSecret = ethers.hexlify(ethers.randomBytes(16));
      setSecret(generatedSecret);
      sessionStorage.setItem(`secret-game-${gameId}`, generatedSecret);

      setStatusMessage(`Joined game #${gameId} successfully! Your secret: ${generatedSecret}`);
      setPlayerCount(count + 1);
      setHasJoined(true);
    } catch (error) {
      console.error("Error joining the game:", error);
      setStatusMessage(`Failed to join the game with Id#${gameId}.`);
    }
  };

  useEffect(() => {
    if (!walletAddress) return; // Only set up listener if wallet is connected
  
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = getContract(provider);
  
    const handleGameCompleted = (eventGameId, winner, pot) => {
      if (Number(eventGameId) === gameId) { // Only listen for this game
        console.log(`Game ${eventGameId} completed! Winner: ${winner}, Pot: ${ethers.formatEther(pot)} ETH`);
        setStatusMessage(`🎉 Game #${eventGameId} completed! Winner: ${winner}, Pot: ${ethers.formatEther(pot)} ETH`);
      }
    };
  
    // Attach listener
    contract.on("GameCompleted", handleGameCompleted);
  
    // Cleanup listener on unmount or game change
    return () => {
      contract.off("GameCompleted", handleGameCompleted);
    };
  }, [walletAddress, gameId]);
  
  const handleCommitMove = async () => {
    if (!secret) {
      setStatusMessage("Secret is missing. Did you join the game?");
      console.error("Secret is missing.");
      return;
    }
  
    if (!move || move === 0 ) {
      setStatusMessage("Please select a move.");
      return;
    }
  
    try {  
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      console.log("Committing move:", move, "with secret:", secret);
  
      // ✅ Pass move and secret directly (commitHash is computed internally)
      await commitMove(gameId, move, secret, signer);
      setStatusMessage("Move committed successfully! Now wait or reveal.");
  
    } catch (error: any) {
      console.error("Error committing move:", error);
      setStatusMessage("Failed to commit move.");
    }
  };
  

  const handleMoveSelection = (selectedMove: number) => {
    console.log("selectedMove:", selectedMove)

    setMove(selectedMove);
    if (!secret) {
      console.error("Secret not found when selecting move.");
      setStatusMessage("Error: Secret missing. Rejoin game.");
      return;
    }

    const hash = keccak256(
      toUtf8Bytes(selectedMove.toString())
    );
    
    setCommitHash(hash)
    console.log("Commitment Hash:", hash)
  };

  useEffect(() => {
    const fetchGameState = async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      try {
        const state = await getGameState(provider, gameId);
  
        // Check if both players have committed
        const bothCommitted = 
          state.player1.hashedMove !== "0x0000000000000000000000000000000000000000000000000000000000000000" &&
          state.player2.hashedMove !== "0x0000000000000000000000000000000000000000000000000000000000000000";
  
        setPlayersCommitted(bothCommitted);
        setGameStatus(Number(state.status));
      } catch (error) {
        console.error("Error fetching game state:", error);
      }
    };
  
    fetchGameState();
    const interval = setInterval(fetchGameState, 3000); // Check every 3 seconds
  
    return () => clearInterval(interval);
  }, [gameId]);
  
  const handleRevealMove = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    if (!signer) return setStatusMessage("Connect wallet first!")
    try {
      const txHash = await revealMove(gameId, move, secret, signer);
      setStatusMessage('Move revealed. Tx: ${txHash}');
    } catch (error) {
      console.log(error);
      setStatusMessage("Failed to reveal move.");
    }
  };

  const handleLeaveGame = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const count = await getPlayerCount(provider, gameId);

    if (!walletAddress) return;

    try {
      await leaveGame(gameId, signer);
      setStatusMessage("You left the game.");
      setHasJoined(false);
      setPlayerCount(count -1 );
      setMove(0);
      setCommitHash("");
      setSecret("");
      sessionStorage.removeItem('secret-game-$(gameId');
      if (timeoutId) clearTimeout(timeoutId);
    } catch (err) {
      console.error(err);
    }
  };

  //Fetch player count when gameID changes
  useEffect(() => {
    const fetchPlayerCount = async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      try {
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
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        if (!walletAddress) return;
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
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Block Paper Scissors</h1>
  
      {/* Wallet Section */}
      {walletAddress ? (
        <div className={styles.walletSection}>
          <p>Wallet Connected: {walletAddress}</p>
          <button className={styles.button} onClick={disconnectWallet}>Disconnect</button>
        </div>
      ) : (
        <button className={styles.button} onClick={handleConnectWallet}>Connect Wallet</button>
      )}
  
      {/* Game Section */}
      {walletAddress && (
        <div className={styles.gameSection}>
          <label htmlFor="gameId">Game ID:</label>
          <input
            type="number"
            id="gameId"
            value={gameId}
            onChange={(e) => setGameId(Number(e.target.value))}
            min={1}
            className={styles.input}
          />
  
          {/* Only first player sets bet */}
          {!hasJoined && playerCount === 0 && (
            <>
              <label htmlFor="betAmount">Bet Amount (ETH):</label>
              <input
                type="text"
                id="betAmount"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className={styles.input}
              />
            </>
          )}
  
          {/* Join or waiting */}
          {!hasJoined ? (
            <button className={styles.button} onClick={handleJoinGame}>Join Game</button>
          ) : playerCount === 1 ? (
            <p>Waiting for another player to join...</p>
          ) : (
            <>
              <p>Game is ready! You can now make your move.</p>
  
              {/* Commit section only if secret exists */}
              {secret && (
                <div className={styles.commitSection}>
                  <label htmlFor="move">Select Move:</label>
                  <select
                    id="move"
                    value={move}
                    onChange={(e) => handleMoveSelection(Number(e.target.value))}
                    className={styles.input}
                  >
                    <option value={0}>Select</option>
                    <option value={1}>Rock</option>
                    <option value={2}>Paper</option>
                    <option value={3}>Scissors</option>
                  </select>
  
                  <p>Your secret (keep this safe for reveal): {secret}</p>
                  {playersCommitted && commitHash && (
                    <button className={styles.button} onClick={handleRevealMove}>Reveal Move</button>
                  )}
                    
                  <button className={styles.button} onClick={handleCommitMove}>Commit Move</button>
                </div>
              )}
            </>
          )}
  
          {/* Leave Game Option */}
          {hasJoined && (
            <button className={styles.leaveButton} onClick={handleLeaveGame}>Leave Game</button>
          )}
  
          {/* Status message */}
          {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}
        </div>
      )}
    </div>
  )
};
export default Web3Dashboard;