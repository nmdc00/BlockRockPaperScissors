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
        ["uint8", "string"],
        [1, "secret1"]
      )
    );

    hashedMove2 = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint8", "string"],
        [2, secret2]
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
    // Owner creates a game
    const tx = await contract.connect(owner).createGame();
    const receipt = await tx.wait();
    // console.log("Logs:", receipt.logs);
    // Game validation

    const event = receipt.logs.find((log) => log.fragment.name === "GameCreated");
    // console.log(event)
    expect(event).to.exist;
    expect(event.args.gameId).to.equal(1n);
    expect(event.args.betAmount).to.equal(0);

    // Validate game state
    const game = await contract.games(1);
    expect(game.pot).to.equal(0);
    expect(game.status).to.equal(0);
  });

  it("should allow Player1 to join the game and set the pot", async function () {
    const player1Bet = ethers.parseEther("1.0"); // Player1 contributes 1 Ether
  
    // Owner creates a game
    await contract.connect(owner).createGame();
  
    // Player1 joins the game
    const tx = await contract.connect(player1).joinGame(1, hashedMove1, { value: player1Bet });
    const receipt = await tx.wait();
  
    // Validate the PlayerJoined event
    const event = receipt.logs.find((log) => log.fragment && log.fragment.name === "PlayerJoined");
    expect(event).to.exist;
    expect(event.args.gameId).to.equal(1n);
    expect(event.args.player).to.equal(player1.address);
  
    // Validate game state
    const game = await contract.games(1);
    expect(game.player1.addr).to.equal(player1.address); // Player1 is registered
    expect(game.pot).to.equal(player1Bet); // Pot matches Player1's bet
    expect(game.status).to.equal(0); // WaitingForPlayers
  });

  it("should allow Player2 to join the game by matching Player1's bet", async function () {
    const player1Bet = ethers.parseEther("1.0"); // Player1 contributes 1 Ether
    const player2Bet = ethers.parseEther("1.0"); // Player2 matches Player1's bet

    // Owner creates a game
    await contract.connect(owner).createGame();

    // Player1 joins the game
    await contract.connect(player1).joinGame(1, hashedMove1, { value: player1Bet });

    // Player2 joins the game
    const tx = await contract.connect(player2).joinGame(1, hashedMove2, { value: player2Bet });
    const receipt = await tx.wait();

    // Validate the PlayerJoined event
    const event = receipt.logs.find((log) => log.fragment && log.fragment.name === "PlayerJoined");
    expect(event).to.exist;
    expect(event.args.gameId).to.equal(1n);
    expect(event.args.player).to.equal(player2.address);

    // Validate game state
    const game = await contract.games(1);
    expect(game.player2.addr).to.equal(player2.address); // Player2 is registered
    expect(game.pot).to.equal(player1Bet + player2Bet); // Pot is the sum of bets
    expect(game.status).to.equal(1); // MovesCommitted
  });

  it("should reject Player2 if their bet does not match Player1's bet", async function () {
    const player1Bet = ethers.parseEther("1.0"); // Player1 contributes 1 Ether
    const player2Bet = ethers.parseEther("0.5"); // Player2 contributes less
  
    // Owner creates a game
    await contract.connect(owner).createGame();
  
    // Player1 joins the game
    await contract.connect(player1).joinGame(1, hashedMove1, { value: player1Bet });
  
    // Player2 joins the game
    await expect(
      contract.connect(player2).joinGame(1, hashedMove2, { value: player2Bet })
    ).to.be.revertedWith("Bet amount must match Player1's bet");
  });

  it("should allow players to reveal their moves and determine the winner", async function () {
    const betAmount = ethers.parseEther("1.0");
    console.log("Player1's hashedMove:", hashedMove1);

    // Owner creates a game
    await contract.connect(owner).createGame();
  
    // Player1 joins the game
    await contract.connect(player1).joinGame(1, hashedMove1, { value: betAmount });
  
    // Player2 joins the game
    await contract.connect(player2).joinGame(1, hashedMove2, { value: betAmount });
  
    // Validate that the game status is MovesCommitted
    const game = await contract.games(1);
    expect(game.status).to.equal(1); // MovesCommitted (enum value 1)
  
    // Player 1 reveals their move
    let tx = await contract.connect(player1).revealMove(1, 1, secret1); // Move.Rock = 1
    let receipt = await tx.wait();
  
    // Validate the MoveRevealed event for Player1
    let event = receipt.logs.find((log) => log.fragment && log.fragment.name === "MoveRevealed");
    expect(event).to.exist;
    expect(event.args.gameId).to.equal(1);
    expect(event.args.player).to.equal(player1.address);
    expect(event.args.move).to.equal(1); // Rock
  
    // Player 2 reveals their move
    tx = await contract.connect(player2).revealMove(1, 2, secret2); // Move.Paper = 2
    receipt = await tx.wait();
  
    // Validate the MoveRevealed event for Player2
    event = receipt.logs.find((log) => log.fragment && log.fragment.name === "MoveRevealed");
    expect(event).to.exist;
    expect(event.args.gameId).to.equal(1);
    expect(event.args.player).to.equal(player2.address);
    expect(event.args.move).to.equal(2); // Paper
  
    // Validate the GameCompleted event
    event = receipt.logs.find((log) => log.fragment && log.fragment.name === "GameCompleted");
    expect(event).to.exist;
    expect(event.args.gameId).to.equal(1);
    expect(event.args.winner).to.equal(player2.address);
    expect(event.args.pot).to.equal(betAmount.mul(2)); // Total pot is the sum of both bets
  });
});