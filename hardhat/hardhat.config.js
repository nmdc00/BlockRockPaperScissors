require("@nomicfoundation/hardhat-toolbox");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20", // Set the Solidity version to match your contracts
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337, // Set the Hardhat local network chain ID
    },
    localhost: {
      url: "http://127.0.0.1:8545", // Default localhost network
      chainId: 1337,
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