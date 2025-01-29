import { ethers, BrowserProvider, Contract } from "ethers";
const contractABI = require("../contractABI.json"); // Adjust path as needed

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

export const joinGame = async (gameId: number, signer: ethers.Signer): Promise<void> => {

  try {
    const contract = getContract(signer); // Use signer, not provider
    const tx = await contract.joinGame(gameId);
    await tx.wait();

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