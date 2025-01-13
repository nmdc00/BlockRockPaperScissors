const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RockPaperScissors", function () {
  let contract
  let owner
  let player1
  let player2
  let hashedMove1
  let hashedMove2
  let secret1
  let secret2

  before(async () => {
    //Contract Deployment

    const RockPaperScissors = await ethers.getContractFactory("RockPaperScissors");
    contract = await RockPaperScissors.deploy();
    await contract.deployed();

    [owner, player1, player2] = await ethers.getSigners();

    const move1 = ethers.utils.formatBytes32String("Rock");
    const secret1 = ethers.utils.formatBytes32String("secret1");
    hashedMove1 = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(["bytes32", "bytes32"], [move1, secret1]));

    const move2 = ethers.utils.formatBytes32String("Rock");
    const secret2 = ethers.utils.formatBytes32String("secret1");
    hashedMove2 = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(["bytes32", "bytes32"], [movew, secretw]));
  });

  it("should allow the owner to create a game", async function () {
    const betAmount = ethers.utils.parseEther("1.0");

    const tx = await contract.connect(owner).createGame({ value: betAmount });
    const receipt = await tx.wait();

    // Game validation

    const event = receipt.events.find((e) => e.event === "GameCreated");
    expect(event).to.exist;
    expect(event.args.gameId).to.equal(1);
    expect(event.args.betAmount).to.equal(betAmount);

    // Validate game state
    const game = await contract.games(1);
    expect(game.pot).to.equal(betAmount);
    expect(game.status).to.equal(0);
  });

  it("should allow player1 to join the game", async function () {
    const betAmount = ethers.utils.parseEther("1.0");

    // Player 1 joins the game
    const tx = await contract.connect(player1).joinGame(1, hashedMove1, { value: betAmount });
    const receipt = await tx.wait();

    // Validate the PlayerJoined event
    const event = receipt.events.find((e) => e.event === "PlayerJoined");
    expect(event).to.exist;
    expect(event.args.gameId).to.equal(1);
    expect(event.args.player).to.equal(player1.address);

    // Validate game state
    const game = await contract.games(1);
    expect(game.player1.addr).to.equal(player1.address);
    expect(game.player1.hashedMove).to.equal(hashedMove1);
    expect(game.pot).to.equal(betAmount);
  });

  it("should allow player2 to join the game", async function () {
    const betAmount = ethers.utils.parseEther("1.0");

    // Player 2 joins the game
    const tx = await contract.connect(player2).joinGame(1, hashedMove2, { value: betAmount });
    const receipt = await tx.wait();

    // Validate the PlayerJoined event
    const event = receipt.events.find((e) => e.event === "PlayerJoined");
    expect(event).to.exist;
    expect(event.args.gameId).to.equal(1);
    expect(event.args.player).to.equal(player2.address);

    // Validate game state
    const game = await contract.games(1);
    expect(game.player2.addr).to.equal(player2.address);
    expect(game.player2.hashedMove).to.equal(hashedMove2);
    expect(game.pot).to.equal(ethers.utils.parseEther("2.0")); // Total pot
    expect(game.status).to.equal(1); // MovesCommitted (enum value 1)
  });

  it("should allow players to reveal their moves and determine the winner", async function () {
    // Player 1 reveals their move
    let tx = await contract.connect(player1).revealMove(1, 1, "secret1"); // Move.Rock = 1
    let receipt = await tx.wait();

    // Validate the MoveRevealed event
    let event = receipt.events.find((e) => e.event === "MoveRevealed");
    expect(event).to.exist;
    expect(event.args.gameId).to.equal(1);
    expect(event.args.player).to.equal(player1.address);
    expect(event.args.move).to.equal(1); // Rock

    // Player 2 reveals their move
    tx = await contract.connect(player2).revealMove(1, 2, "secret2"); // Move.Paper = 2
    receipt = await tx.wait();

    // Validate the MoveRevealed event
    event = receipt.events.find((e) => e.event === "MoveRevealed");
    expect(event).to.exist;
    expect(event.args.gameId).to.equal(1);
    expect(event.args.player).to.equal(player2.address);
    expect(event.args.move).to.equal(2); // Paper

    // Validate the GameCompleted event
    event = receipt.events.find((e) => e.event === "GameCompleted");
    expect(event).to.exist;
    expect(event.args.gameId).to.equal(1);
    expect(event.args.winner).to.equal(player2.address);
    expect(event.args.pot).to.equal(ethers.utils.parseEther("2.0"));
  });
});