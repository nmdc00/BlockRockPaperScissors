import { ethers, BrowserProvider, Contract } from "ethers";
const contractABI = require("/home/nuno/projects/BlockRockPaperScissors/hardhat/contractABI.json"); // Adjust path as needed

const CONTRACT_ADDRESS = window.ENV?.CONTRACT_ADDRESS;

// Helper to get the contract instance
export const getContract = (
  signerOrProvider: ethers.Signer | ethers.Provider
): Contract => {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address is not defined!");
  }

  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signerOrProvider);
};

export const joinGame = async (
  gameId: number, 
  signer: ethers.Signer,
  betAmount?: string
): Promise<void> => {

  try {
    const contract = getContract(signer); // Use signer, not provider

    const value = betAmount ? ethers.parseEther(betAmount) : ethers.parseEther("0");

    console.log(`Joining game ${gameId} with ${ethers.formatEther(value)} ETH`); // Debug log

    if (value === ethers.parseEther("0")) {
      throw new Error("Player 2 must send ETH but is trying to send 0!");
    }

    const tx = await contract.joinGame(gameId, { value });
    await tx.wait();

    console.log(`Successfully joined game #${gameId}`);

  } catch (error) {
    console.error("Error joining the game:", error);
    throw error;
  }
};

export const hasPlayerJoined = async (
  provider: ethers.Provider,
  gameId: number,
  playerAddress: string
): Promise<boolean> => {
  const contract = getContract(provider);
  const game = await contract.games(gameId);

  return game.player1.addr === playerAddress || game.player2.addr === playerAddress;
};

export const getPlayerCount = async (
  provider: ethers.Provider,
  gameId: number
): Promise<number> => {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address is not defined!");
  }

  try {
    const contract = getContract(provider);
    const count = await contract.getPlayerCount(gameId);
    console.log(`Player count for game #${gameId}:`, count.toString());
    return Number(count);
  } catch (error) {
    console.error("Error fetching player count:", error);
    throw error;
  }
}

export const commitMove = async (
  gameId: number,
  commitHash: string,
  signer: ethers.Signer
): Promise<void> => {
  try {
    const contract = getContract(signer);

    console.log("Generated commit hash:", commitHash);

    // Call commitMove on the contract
    const tx = await contract.commitMove(gameId, commitHash);
    console.log("Transaction submitted:", tx.hash);

    await tx.wait();
    console.log("Move committed successfully on-chain!");
  } catch (error) {
    console.error("Failed to commit move:", error);
    throw error; // propagate error for React to catch
  }
};

export const revealMove = async (
  gameId: number,
  move: number,
  secret: string,
  signer: ethers.Signer
) => {
  try {
    const contract = getContract(signer);

    const tx = await contract.revealMove(gameId, move, secret);
    await tx.wait()
    console.log("Move revealed successfully");
  } catch (error) {
    console.error("Failed to reveal move", error)
    throw error;
  }
};

export const leaveGame = async (
  gameId: number,
  signer: ethers.Signer
): Promise<string> => {

  const contract = getContract(signer);
  const game = await contract.games(gameId);

  console.log(`Game #${gameId} status: ${Number(game.status)}`);
  
  try {
    const tx = await contract.leaveGame(gameId);
    await tx.wait();
    console.log("Game left successfully");
    return tx.hash;
  } catch (error) {
    console.error("Failed to leave game:", error);
    throw error;
  }
};

export const getGameState = async (provider: ethers.Provider, gameId: number)
: Promise<any> => {
  const contract = getContract(provider);
  const game = await contract.games(gameId);

  return {
    player1: game.player1,
    player2: game.player2,
    status: game.status,
  }
}

export const checkForWinner = async (
  provider: ethers.Provider,
  gameId: number
): Promise<{ winner: string; pot: string, result: string }> => {
  const contract = getContract(provider);

  try {
    const game = await contract.games(gameId);
    
    if (Number(game.status) !== 2) {
      return { winner: "", pot: "0", result: "" }; // If game is not completed, return no winner
    }

    const filter = contract.filters.GameCompleted(gameId);
    const logs = await contract.queryFilter(filter);

    if (logs.length > 0) {
      const parsedEvent = contract.interface.parseLog(logs[0]); // Parse the event safely
      if (!parsedEvent || !parsedEvent.args) {
        console.warn("No valid winner event found");
        return { winner: "", pot: "0", result: "" };
      }

      const winner = parsedEvent.args[1]; // Winner address
      const pot = parsedEvent.args[2]; // Pot amount
      
      const move1 = Number(game.player1.revealedMove);
      const move2 = Number(game.player2.revealedMove);

      let result = "";
      
      if (move1 === move2) {
        result = "It's a draw!";
      } else if (
        (move1 === 1 && move2 === 3) ||
        (move1 === 2 && move2 === 1) ||
        (move1 === 3 && move2 === 2) 
      ) {
        result = `${getMoveName(move1)} beat ${getMoveName(move2)}`;
      } else {
        result = `${getMoveName(move2)} beat ${getMoveName(move1)}`;
      }

      return { winner, pot: ethers.formatEther(pot), result };
    }

    return { winner: "", pot: "0", result: "" }; // Default if no event found
  } catch (error) {
    console.error("Error checking for winner:", error);
    return { winner: "", pot: "0", result: "" };
  }
};

const getMoveName = (move: number): string => {
  return move === 1 ? 'Block' : move === 2 ? "Paper" : "Scissors";
}