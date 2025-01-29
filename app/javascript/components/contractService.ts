import { ethers, BrowserProvider, Contract } from "ethers";
const contractABI  = require("../contractABI.json"); // Adjust path as needed

const CONTRACT_ADDRESS = window.ENV?.CONTRACT_ADDRESS

//Get the contract
export const getContract = (
  signerOrProvider: ethers.Signer | ethers.Provider
): Contract => {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address is not defined!");
  }

  return new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi , signerOrProvider);
};

// Join the Game
export const joinGame = async (signer: ethers.Signer): Promise<void> => {
  const contract = getContract(signer);
  const tx = await contract.joinGame();
  await tx.wait();
};

// Get the number of players
export const getPlayerCount = async (
  provider: ethers.Provider,
  gameId: number
): Promise<number> => {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address is not defined!");
  }

  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, provider);

  try {
    const count = await contract.getPlayerCount(gameId);
    console.log(`Player count for game ${gameId}:`, count);
    return count.toNumber(); // Convert BigNumber to number
  } catch (error) {
    console.error("Error fetching player count:", error);
    throw error;
  }
};

// Listen for the "GameReady" event
export const listenForGameReady = (
  provider: ethers.Provider,
  callback: (player1: string, player2: string) => void
): void => {
  const contract = getContract(provider);
  contract.on("GameReady", (player1, player2) => {
    callback(player1, player2);
  });
};