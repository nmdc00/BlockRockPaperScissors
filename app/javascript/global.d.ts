import { Eip1193Provider } from "ethers";

declare global {
  interface Window {
    ethereum: Eip1193Provider;
    ENV: {
      CONTRACT_ADDRESS?: string; // Add more properties if needed
    };
  }
}

export {};
