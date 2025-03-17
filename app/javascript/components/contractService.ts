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
  move: number,
  secret: string,
  signer: ethers.Signer
): Promise<void> => {
  try {
    const contract = getContract(signer);

    console.log("Generated commit hash:", secret);

    // Call commitMove on the contract
    const tx = await contract.commitMove(gameId, secret);
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
  const contract = getContract(signer);

  const tx = await contract.revealMove(gameId, move, secret);
  await tx.wait()
  console.log("Move revealed successfully");
  return tx.hash
};

export const leaveGame = async (
  gameId: number,
  signer: ethers.Signer
): Promise<string> => {
  const contract = getContract(signer);

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