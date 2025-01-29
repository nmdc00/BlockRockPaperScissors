const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const artifact = require("../../artifacts/contracts/RPS.sol/RockPaperScissors.json");

module.exports = buildModule("RockPaperScissorsModule", (m) => {
  // Deploy the RockPaperScissors contract
  const rockPaperScissors = m.contract("RockPaperScissors", [], {
    id: "rockPaperScissors", // Unique ID for the deployment
    bytecode: artifact.bytecode, // Use the artifact's bytecode
    abi: artifact.abi, // Use the artifact's ABI
  });

  // Example: Call the createGame function after deployment
  m.call(rockPaperScissors, "createGame", []);

  // Return the deployed contract
  return { rockPaperScissors };
});
