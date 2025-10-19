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
  checkForWinner,
} from "./contractService";
import { keccak256, AbiCoder, ethers } from "ethers";
import styles from "../components/Web3Dashboard.module.css";

const contractABI = require("../../../hardhat/contractABI.json");

interface Web3DashboardProps {
  contractAddress: string;
}

const MOVES = {
  NONE: 0,
  BLOCK: 1,
  PAPER: 2,
  SCISSORS: 3,
};

const MOVE_ICONS = {
  [MOVES.BLOCK]: "🟫",
  [MOVES.PAPER]: "📄",
  [MOVES.SCISSORS]: "✂️",
};

const MOVE_NAMES = {
  [MOVES.BLOCK]: "Block",
  [MOVES.PAPER]: "Paper",
  [MOVES.SCISSORS]: "Scissors",
};

const Web3Dashboard: React.FC<Web3DashboardProps> = ({ contractAddress }) => {
  // Wallet state
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Game state
  const [gameId, setGameId] = useState<number>(1);
  const [hasJoined, setHasJoined] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [gameStatus, setGameStatus] = useState<number>(0);

  // Move state
  const [selectedMove, setSelectedMove] = useState<number>(MOVES.NONE);
  const [secret, setSecret] = useState<string>("");
  const [commitHash, setCommitHash] = useState<string>("");
  const [playersCommitted, setPlayersCommitted] = useState<boolean>(false);

  // UI state
  const [betAmount, setBetAmount] = useState<string>("0.01");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [showLeaveButton, setShowLeaveButton] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Reset wallet on page load
  useEffect(() => {
    setWalletAddress(null);
  }, []);

  // Load saved secret from session storage
  useEffect(() => {
    const savedSecret = sessionStorage.getItem(`secret-game-${gameId}`);
    if (savedSecret) {
      setSecret(savedSecret);
    }
  }, [gameId]);

  // Check player joined status
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
  }, [gameId, walletAddress]);

  // Fetch player count periodically
  useEffect(() => {
    const fetchPlayerCount = async () => {
      try {
        if (!window.ethereum) return;
        const provider = new ethers.BrowserProvider(window.ethereum);
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

  // Fetch game state periodically
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        if (!window.ethereum) return;
        const provider = new ethers.BrowserProvider(window.ethereum);
        const state = await getGameState(provider, gameId);

        const bothCommitted =
          state.player1.hashedMove !==
            "0x0000000000000000000000000000000000000000000000000000000000000000" &&
          state.player2.hashedMove !==
            "0x0000000000000000000000000000000000000000000000000000000000000000";

        setPlayersCommitted(bothCommitted);
        setGameStatus(Number(state.status));
      } catch (error) {
        console.error("Error fetching game state:", error);
      }
    };

    fetchGameState();
    const interval = setInterval(fetchGameState, 3000);
    return () => clearInterval(interval);
  }, [gameId]);

  // Listen for game completed events
  useEffect(() => {
    if (!walletAddress || !window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = getContract(provider);

    const handleGameCompleted = (
      gameId: any,
      winner: any,
      pot: ethers.BigNumberish
    ) => {
      console.log(
        `Game ${gameId} completed! Winner: ${winner}, Pot: ${ethers.formatEther(pot)} ETH`
      );
      setStatusMessage(
        `🎉 Game #${gameId} completed! Winner: ${winner}, Pot: ${ethers.formatEther(pot)} ETH`
      );
      setShowLeaveButton(true);
    };

    contract.on("GameCompleted", handleGameCompleted);

    return () => {
      contract.off("GameCompleted", handleGameCompleted);
    };
  }, [walletAddress, gameId]);

  const handleConnectWallet = async () => {
    const signer = await connectWallet();
    if (signer) {
      setWalletAddress(await signer.getAddress());
      setStatusMessage("Wallet connected successfully!");
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    setWalletAddress(null);
    setStatusMessage("Wallet disconnected");
  };

  const handleJoinGame = async () => {
    if (!walletAddress) {
      setStatusMessage("Please connect your wallet first.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
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

      // Generate secret on joining
      const generatedSecret = ethers.hexlify(ethers.randomBytes(16));
      setSecret(generatedSecret);
      sessionStorage.setItem(`secret-game-${gameId}`, generatedSecret);

      setStatusMessage(
        `✅ Joined game #${gameId}! Keep your secret safe for the reveal phase.`
      );
      setPlayerCount(count + 1);
      setHasJoined(true);
    } catch (error) {
      console.error("Error joining the game:", error);
      setStatusMessage(`❌ Failed to join game #${gameId}.`);
    }
  };

  const handleMoveSelection = (move: number) => {
    setSelectedMove(move);

    if (!secret) {
      console.error("Secret not found when selecting move.");
      setStatusMessage("Error: Secret missing. Rejoin game.");
      return;
    }

    const abiCoder = AbiCoder.defaultAbiCoder();
    const hash = keccak256(abiCoder.encode(["uint8", "string"], [move, secret]));

    setCommitHash(hash);
    setStatusMessage(`Selected: ${MOVE_NAMES[move]} 🎮`);
    console.log("Commitment Hash:", hash);
  };

  const handleCommitMove = async () => {
    if (!secret) {
      setStatusMessage("Secret is missing. Did you join the game?");
      return;
    }

    if (!selectedMove || selectedMove === MOVES.NONE) {
      setStatusMessage("Please select a move first!");
      return;
    }

    if (!commitHash) {
      setStatusMessage("Please select your move again.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      await commitMove(gameId, commitHash, signer);
      setStatusMessage(
        `✅ Move committed! Wait for both players to commit before revealing.`
      );
    } catch (error: any) {
      console.error("Error committing move:", error);
      setStatusMessage("❌ Failed to commit move.");
    }
  };

  const handleRevealMove = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    if (!signer) {
      setStatusMessage("Connect wallet first!");
      return;
    }

    try {
      await revealMove(gameId, selectedMove, secret, signer);
      setStatusMessage("✅ Move revealed! Checking for winner...");

      // Check if moves are revealed
      const checkInterval = setInterval(async () => {
        const { player1Move, player2Move } = await getGameMoves(provider, gameId);

        if (player1Move !== 0 && player2Move !== 0) {
          clearInterval(checkInterval);

          const { winner, pot, result } = await checkForWinner(provider, gameId);
          if (winner && winner !== ethers.ZeroAddress) {
            setStatusMessage(
              `🎉 Game #${gameId} completed! Winner: ${winner}, Pot: ${pot} ETH. ${result}`
            );
            setShowLeaveButton(true);
          } else {
            setStatusMessage("Game completed, but no winner found.");
          }
        }
      }, 3000);
    } catch (error) {
      console.error("Error revealing move:", error);
      setStatusMessage("❌ Failed to reveal move.");
    }
  };

  const getGameMoves = async (provider, gameId) => {
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const game = await contract.games(gameId);
    return {
      player1Move: Number(game.player1.revealedMove),
      player2Move: Number(game.player2.revealedMove),
    };
  };

  const handleLeaveGame = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const count = await getPlayerCount(provider, gameId);

    if (!walletAddress) return;

    try {
      await contractLeaveGame(gameId, signer);
      setStatusMessage("👋 You left the game.");
      setHasJoined(false);
      setPlayerCount(count - 1);
      setSelectedMove(MOVES.NONE);
      setCommitHash("");
      setSecret("");
      sessionStorage.removeItem(`secret-game-${gameId}`);
      if (timeoutId) clearTimeout(timeoutId);
      setShowLeaveButton(false);
    } catch (err) {
      console.error(err);
      setStatusMessage("❌ Failed to leave game.");
    }
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>⛏️ BLOCK PAPER SCISSORS ⚔️</h1>

      {/* Wallet Section */}
      {walletAddress ? (
        <div className={styles.walletSection}>
          <p>⚡ Connected: {walletAddress}</p>
          <button className={styles.leaveButton} onClick={handleDisconnectWallet}>
            Disconnect
          </button>
        </div>
      ) : (
        <div className={styles.walletSection}>
          <button className={styles.button} onClick={handleConnectWallet}>
            Connect Wallet
          </button>
        </div>
      )}

      {/* Game Section */}
      {walletAddress && (
        <>
          <div className={styles.divider}></div>

          <div className={styles.gameSection}>
            <label htmlFor="gameId">🎮 Game ID</label>
            <input
              type="number"
              id="gameId"
              value={gameId}
              onChange={(e) => setGameId(Number(e.target.value))}
              min={1}
              className={styles.input}
              disabled={hasJoined}
            />

            <div className={styles.infoPanel}>
              <strong>Players:</strong> {playerCount}/2
            </div>

            {!hasJoined && playerCount === 0 && (
              <>
                <label htmlFor="betAmount">💰 Bet Amount (ETH)</label>
                <input
                  type="text"
                  id="betAmount"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className={styles.input}
                  placeholder="0.01"
                />
              </>
            )}

            {!hasJoined ? (
              <button className={styles.button} onClick={handleJoinGame}>
                🚪 Join Game
              </button>
            ) : playerCount === 1 ? (
              <div className={styles.waitingMessage}>
                ⏳ Waiting for another player to join...
              </div>
            ) : (
              <>
                <div className={styles.commitSection}>
                  <label>⚔️ Choose Your Weapon</label>

                  <div className={styles.moveButtons}>
                    {[MOVES.BLOCK, MOVES.PAPER, MOVES.SCISSORS].map((move) => (
                      <div
                        key={move}
                        className={`${styles.moveButton} ${
                          selectedMove === move ? styles.selected : ""
                        }`}
                        onClick={() => handleMoveSelection(move)}
                        data-label={MOVE_NAMES[move]}
                      >
                        {MOVE_ICONS[move]}
                      </div>
                    ))}
                  </div>

                  {secret && (
                    <div className={styles.infoPanel}>
                      <strong>Secret:</strong> {secret.substring(0, 20)}...
                      <br />
                      <em>Keep this safe for the reveal phase!</em>
                    </div>
                  )}

                  {selectedMove !== MOVES.NONE && !playersCommitted && (
                    <button className={styles.button} onClick={handleCommitMove}>
                      ✅ Commit Move
                    </button>
                  )}

                  {playersCommitted && commitHash && (
                    <>
                      <div className={styles.waitingMessage}>
                        ✨ Both players have committed! Time to reveal!
                      </div>
                      <button className={styles.button} onClick={handleRevealMove}>
                        🎲 Reveal Move
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {hasJoined && !showLeaveButton && (
              <button className={styles.leaveButton} onClick={handleLeaveGame}>
                🚪 Leave Game
              </button>
            )}

            {showLeaveButton && (
              <div className={styles.resultSection}>
                <button className={styles.button} onClick={handleLeaveGame}>
                  🚪 Leave Game
                </button>
              </div>
            )}
          </div>

          {statusMessage && (
            <div className={styles.statusMessage}>{statusMessage}</div>
          )}
        </>
      )}
    </div>
  );
};

export default Web3Dashboard;
