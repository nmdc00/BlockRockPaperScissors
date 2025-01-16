require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Load environment variables from .env
// Ensure your configuration variables are set before executing the script

// Ensure environment variables are set
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || "";

console.log("INFURA_API_KEY:", process.env.INFURA_API_KEY);
console.log("SEPOLIA_PRIVATE_KEY:", process.env.SEPOLIA_PRIVATE_KEY);

if (!INFURA_API_KEY || !SEPOLIA_PRIVATE_KEY) {
  throw new Error("Please set INFURA_API_KEY and SEPOLIA_PRIVATE_KEY in your .env file");
}
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20", // Set the Solidity version to match your contracts
  defaultNetwork: "sepolia",
  networks: {
    sepolia: {
      chainId: 11155111, // Set the Sepolia local network chain ID
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
    // Uncomment and configure for testnets or mainnet
    // rinkeby: {
    //   url: `https://rinkeby.infura.io/v3/YOUR_INFURA_PROJECT_ID`,
    //   accounts: [`0x${YOUR_PRIVATE_KEY}`],
    // },
  },
  paths: {
    sources: "./contracts", // Directory for Solidity contracts
    tests: "./test", // Directory for tests
    cache: "./cache", // Directory for cache
    artifacts: "./artifacts", // Directory for artifacts
  },
};