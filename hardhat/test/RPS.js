const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RockPaperScissors", function () {
  let contract
  let owner
  let player1
  let player2
  let hashedMove1
  let hashedMove2

  before(async () => {
    //Contract Deployment

    const RockPaperScissors = await ethers.getContractFactory("RockPaperScissors");
    contract = await RockPaperScissors.deploy();
    await contract.deployed();

    [owner, player1, player2] = await ethers.getSigners();

    const move1 = ethers.utils.formatBytes32String("Rock");
    const secret1 = ethers.utils.formatBytes32String("secret1");
    hashedMove1 = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32", "bytes32"], [move1, secret1]));

    const move2 = ethers.utils.formatBytes32String("Rock");
    const secret2 = ethers.utils.formatBytes32String("secret1");
    hashedMove2 = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32", "bytes32"], [movew, secretw]));
  });

  // it("should allow the owner to create a game", async function () {
  //   const bet
  // })
});