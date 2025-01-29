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
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = getContract(signer);

    const tx = await contract.joinGame(gameId, {
    });

    await tx.wait();

    console.log(`Successfully joined game #${gameId}`);

  } catch (error) {
    console.error("Error joining the game:", error);
    throw error;
  }
};
