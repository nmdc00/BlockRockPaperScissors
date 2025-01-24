import { Eip1193Provider } from "ethers"

declare global {
    interface Window {
        ethereum: Eip1193Provider
    }
}

export {};

declare global {
    interface Window {
      ENV: {
        DEPLOYED_CONTRACT_ADDRESS?: string; // Add more properties if needed
      };
    }
  }