const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const RockPaperScissorsModule = buildModule("RockPaperScissorsModule", (m) => {
  const rps = m.contract("RockPaperScissors");

  return { rps };
});

module.exports = RockPaperScissorsModule;