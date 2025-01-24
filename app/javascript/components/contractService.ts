import { ethers, BrowserProvider } from "ethers";
const contractABI = require("../contractABI.json"); // Adjust path as needed

const CONTRACT_ADRESS = process.env.CONTRACT_ADRESS

export const initializeContract = async (provider: { getSigner: () => any; }) => {
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADRESS!, contractABI, signer);
}