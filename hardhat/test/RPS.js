const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RockPaperScissors Contract", function () {
  let contract
  let owner, player1, player2
  let hashedMove1, hashedMove2
  let secret1, secret2

  before(async () => {
    //Contract Deployment

    const RockPaperScissors = await ethers.getContractFactory("RockPaperScissors");
    contract = await RockPaperScissors.deploy();
    await contract.waitForDeployment();
    console.log("Contract deployed to:", contract.target);
    
    [owner, player1, player2] = await ethers.getSigners();

    secret1 = "secret1"
    secret2 = "secret2"

    hashedMove1 = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "bytes32"],
        [ethers.encodeBytes32String("Rock"), ethers.encodeBytes32String(secret1)]
      )
    );

    hashedMove2 = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "bytes32"],
        [ethers.encodeBytes32String("Paper"), ethers.encodeBytes32String(secret2)]
      )
    );
  });

  beforeEach(async () => {
    // Reset blockchain state and redeploy contract before each test
    await hre.network.provider.send("hardhat_reset");
    const RockPaperScissors = await ethers.getContractFactory("RockPaperScissors");
    contract = await RockPaperScissors.deploy();
    await contract.waitForDeployment();
    [owner, player1, player2] = await ethers.getSigners();
  });

  it("should allow the owner to create a game", async function () {
    const betAmount = ethers.parseEther("1.0"); // 1 Ether
    console.log("Bet amount in Wei:", ethers.parseEther("1.0").toString());

    // Owner creates a game
    const tx = await contract.connect(owner).createGame(hashedMove1, {
      value: betAmount,
    });
    const receipt = await tx.wait();
    // console.log("Logs:", receipt.logs);
    // Game validation

    const event = receipt.logs.find((log) => log.fragment.name === "GameCreated");
    // console.log(event)
    expect(event).to.exist;

    const { gameId, betAmount: emittedBetAmount } = event.args;
    expect(event.args.gameId).to.equal(1n);
    expect(event.args.betAmount).to.equal(betAmount);

    // Validate game state
    const game = await contract.games(1);
    expect(game.pot).to.equal(betAmount);
    expect(game.status).to.equal(0);
  });

  it("should generate a hashed move for a player", async function () {
    const betAmount = ethers.parseEther("1.0"); // 1 Ether

    // Owner creates the game
    const tx = await contract.connect(owner).createGame(hashedMove1, { value: betAmount });
    const receipt = await tx.wait();
    
    // Validate the GameCreated event
    const event = receipt.logs.find((log) => log.fragment && log.fragment.name === "GameCreated");
    expect(event).to.exist; // Ensure the event is found

    expect(event.args.gameId).to.equal(1n); // First game
    expect(event.args.betAmount).to.equal(betAmount);
  });

  it("should allow players to join the game with variable bet amounts", async function () {
    const player1Bet = ethers.parseEther("1.0"); // Player1 contributes 1 Ether
    const player2Bet = ethers.parseEther("2.0"); // Player2 contributes 2 Ether
  
    // Owner creates a game
    await contract.connect(owner).createGame();
  
    // Retrieve the game ID
    const gameId = await contract.gameCounter();
  
    // Player1 joins the game
    await contract.connect(player1).joinGame(gameId, hashedMove1, { value: player1Bet });
  
    // Player2 joins the game
    const tx = await contract.connect(player2).joinGame(gameId, hashedMove2, { value: player2Bet });
    const receipt = await tx.wait();
  
    // Validate the PlayerJoined event for Player2
    const event = receipt.logs.find((log) => log.fragment && log.fragment.name === "PlayerJoined");
    expect(event).to.exist;
    expect(event.args.gameId).to.equal(gameId);
    expect(event.args.player).to.equal(player2.address);
  
    // Validate game state
    const game = await contract.games(gameId);
    expect(game.player1.addr).to.equal(player1.address); // Player1 is registered
    expect(game.player2.addr).to.equal(player2.address); // Player2 is registered
    expect(game.pot).to.equal(player1Bet.add(player2Bet)); // Pot is the sum of bets
    expect(game.status).to.equal(1); // MovesCommitted
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
    expect(event.args.pot).to.equal(ethers.parseEther("2.0"));
  });
});