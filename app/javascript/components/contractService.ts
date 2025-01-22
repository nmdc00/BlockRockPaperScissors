import { ethers, BrowserProvider } from "ethers";
import contractABI from "../contractABI.json";

const CONTRACT_ADRESS = process.env.CONTRACT_ADRESS

const provider = new BrowserProvider(window.ethereum);

export const initializeContract = async (provider: BrowserProvider(window.ethereum)) => {
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADRESS!, contractABI, signer);
}