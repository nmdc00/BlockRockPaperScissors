import { ethers } from "ethers";
import contractABI from "../contractABI.json";

const CONTRACT_ADRESS = process.env.CONTRACT_ADRESS

export const initializeContract = async (provider: ethers.providers.Web3provider) => {
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADRESS!, contractABI, signer);
}