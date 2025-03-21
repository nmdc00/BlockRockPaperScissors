import React, { useState, useEffect } from "react";
import { connectWallet, disconnectWallet } from "./wallet";
import {
  hasPlayerJoined,
  joinGame,
  getPlayerCount,
  commitMove,
  revealMove,
  leaveGame as contractLeaveGame,
  getContract,
  getGameState,
  checkForWinner
} from "./contractService";
import { keccak256, AbiCoder, ethers } from "ethers";
import styles from '../components/Web3Dashboard.module.css';

const contractABI = require("/home/nuno/projects/BlockRockPaperScissors/hardhat/contractABI.json");

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
  const [gameStatus, setGameStatus] = useState<number>(0);
  const [playersCommitted, setPlayersCommitted] = useState<boolean>(false);
  const [showLeaveButton, setShowLeaveButton] = useState(false);

  const resetGameSession = () => {
    setStatusMessage("Game session reset.");
    setHasJoined(false);
    setMove(0);
    setCommitHash("");
    setSecret("");
    sessionStorage.removeItem(`secret-game-${gameId}`);
    setPlayerCount(0);
    setGameStatus(0);
    setPlayersCommitted(false);
    if (timeoutId) clearTimeout(timeoutId);
  };

  const handleConnectWallet = async () => {
    const signer = await connectWallet();
    if (signer) {
      setWalletAddress(await signer.getAddress());
    }
  };

  const handleJoinGame = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    if (!walletAddress) {
      setStatusMessage("Please connect your wallet first.");
      return;
    }

    try {
      const count = await getPlayerCount(provider, gameId);
      let amount = betAmount;

      if (count === 0) {
        console.log(`Player 1 joining game #${gameId} with bet ${betAmount} ETH`);
      } else {
        const contract = getContract(provider);
        const game = await contract.games(gameId);
        amount = ethers.formatEther(game.betAmount);
        console.log(`Player 2 joining game #${gameId}, matching bet ${amount} ETH`);
      }

      await joinGame(gameId, signer, amount);
      const generatedSecret = ethers.hexlify(ethers.randomBytes(16));
      setSecret(generatedSecret);
      sessionStorage.setItem(`secret-game-${gameId}`, generatedSecret);

      setStatusMessage(`Joined game #${gameId} successfully! Your secret: ${generatedSecret}`);
      setHasJoined(true);
    } catch (error) {
      console.error("Error joining the game:", error);
      setStatusMessage(`Failed to join the game with Id#${gameId}.`);
    }
  };

  const handleMoveSelection = (selectedMove: number) => {
    setMove(selectedMove);
    if (!secret) {
      setStatusMessage("Error: Secret missing. Rejoin game.");
      return;
    }

    const abiCoder = AbiCoder.defaultAbiCoder();
    const hash = keccak256(abiCoder.encode(["uint8", "string"], [selectedMove, secret]));
    setCommitHash(hash);
  };

  const handleCommitMove = async () => {
    if (!secret || !move) {
      setStatusMessage("Secret or move missing.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      await commitMove(gameId, commitHash, signer);
      setStatusMessage("Move committed successfully! Now wait or reveal.");
    } catch (error) {
      console.error("Error committing move:", error);
      setStatusMessage("Failed to commit move.");
    }
  };

  const handleRevealMove = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    if (!signer) return setStatusMessage("Connect wallet first!");
  
    try {
      await revealMove(gameId, move, secret, signer);
      setStatusMessage("✅ Move revealed! Waiting for opponent...");
  
      const checkInterval = setInterval(async () => {
        try {
          const contract = getContract(provider);
          const game = await contract.games(gameId);
  
          const move1 = Number(game.player1.revealedMove);
          const move2 = Number(game.player2.revealedMove);
  
          // Only update message if both players have revealed
          if (move1 !== 0 && move2 !== 0) {
            clearInterval(checkInterval);
            setStatusMessage("✅ Both players revealed! Awaiting final result...");
          }
        } catch (err) {
          console.warn("Error checking game state:", err);
        }
      }, 3000);
    } catch (error) {
      console.error("Error revealing move:", error);
      setStatusMessage("❌ Failed to reveal move.");
    }
  };
  

  const handleLeaveGame = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = getContract(provider);
    const game = await contract.games(gameId);

    if (!walletAddress) return;
    if (Number(game.status) === 2) {
      resetGameSession();
      return;
    }

    try {
      await contractLeaveGame(gameId, signer);
      setStatusMessage("You left the game.");
      resetGameSession();
    } catch (error) {
      console.error("Failed to leave game:", error);
      setStatusMessage("Failed to leave game.");
    }
  };

  useEffect(() => {
    const savedSecret = sessionStorage.getItem(`secret-game-${gameId}`);
    if (savedSecret) setSecret(savedSecret);
  }, [gameId]);

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

    fetchPlayerCount();
    const interval = setInterval(fetchPlayerCount, 2000);
    return () => clearInterval(interval);
  }, [gameId]);

  useEffect(() => {
    const fetchGameState = async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      try {
        const state = await getGameState(provider, gameId);
        const committed =
          state.player1.hashedMove !== ethers.ZeroHash &&
          state.player2.hashedMove !== ethers.ZeroHash;
        setPlayersCommitted(committed);
        setGameStatus(Number(state.status));
      } catch (error) {
        console.error("Error fetching game state:", error);
      }
    };

    fetchGameState();
    const interval = setInterval(fetchGameState, 3000);
    return () => clearInterval(interval);
  }, [gameId]);

  useEffect(() => {
    const checkIfPlayerJoined = async () => {
      try {
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
  }, [gameId, walletAddress]);

  useEffect(() => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = getContract(provider);
    const onGameCompleted = (gid: any, winner: any, pot: ethers.BigNumberish) => {
      setStatusMessage(`🎉 Game #${gid} completed! Winner: ${winner}, Pot: ${ethers.formatEther(pot)} ETH`);
      setShowLeaveButton(true);
    };

    contract.on("GameCompleted", onGameCompleted);
    return () => {
      contract.off("GameCompleted", onGameCompleted);
    };
  }, [walletAddress, gameId]);

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Block Paper Scissors</h1>

      {walletAddress ? (
        <div className={styles.walletSection}>
          <p>Wallet Connected: {walletAddress}</p>
          <button className={styles.button} onClick={disconnectWallet}>Disconnect</button>
        </div>
      ) : (
        <button className={styles.button} onClick={handleConnectWallet}>Connect Wallet</button>
      )}

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

          {!hasJoined ? (
            <button className={styles.button} onClick={handleJoinGame}>Join Game</button>
          ) : playerCount === 1 ? (
            <p>Waiting for another player to join...</p>
          ) : (
            <>
              <p>Game is ready! You can now make your move.</p>
              {secret && playerCount === 2 && (
                <div className={styles.commitSection}>
                  <label htmlFor="move">Select Move:</label>
                  <select
                    id="move"
                    value={move}
                    onChange={(e) => handleMoveSelection(Number(e.target.value))}
                    className={styles.input}
                  >
                    <option value={0}>Select</option>
                    <option value={1}>Block</option>
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

          {hasJoined && !showLeaveButton && (
            <button className={styles.leaveButton} onClick={handleLeaveGame}>Leave Game</button>
          )}

          {showLeaveButton && (
            <div className={styles.resultSection}>
              <p className={styles.statusMessage}>{statusMessage}</p>
              <button className={styles.button} onClick={handleLeaveGame}>Leave Game</button>
            </div>
          )}

          {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}
        </div>
      )}
    </div>
  );
};

export default Web3Dashboard;
