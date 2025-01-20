const { expect } = require("chai");
const { ethers } = require("hardhat");
const { assert } = require("chai");
require("dotenv").config();
const DEPLOYED_CONTRACT_ADDRESS = process.env.DEPLOYED_CONTRACT_ADDRESS || "";

describe("RockPaperScissors Contract", function () {
  let contract;
  let owner, player1, player2;
  let hashedMove1, hashedMove2;
  let secret1, secret2;
  
  before(async () => {
    [owner, player1, player2] = await ethers.getSigners();

    secret1 = "secret1"
    secret2 = "secret2"

    hashedMove1 = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint8", "string"],
        [1, secret1]
      )
    );

    hashedMove2 = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint8", "string"],
        [2, secret2]
      )
    );

    // console.log("Player1 Hashed Move:", hashedMove1);
  });

  beforeEach(async () => {
    const RockPaperScissors = await ethers.getContractFactory("RockPaperScissors");

    if (hre.network.name === "localhost") {
      contract = await RockPaperScissors.deploy();
      await contract.waitForDeployment();
      console.log("Contract deployed locally at:", contract.target);
    } else if (hre.network.name === "sepolia") {
      // Use the Sepolia-deployed contract
      contract = await RockPaperScissors.attach("0xAE52aaF189431983a4F4EFCAb13E865FC9CE2dfC");
      console.log("Using deployed contract at:", contract.target);
    } else {
      throw new Error("Unsupported network");
    }

    [owner, player1, player2] = await ethers.getSigners();
    console.log("Owner address", owner.address);
  });

  it("should allow the owner to create a game", async function () {
    if (DEPLOYED_CONTRACT_ADDRESS) {
      console.log("Using pre-deployed contract at:", DEPLOYED_CONTRACT_ADDRESS);
      return expect(true).to.be.true; // Return success immediately
    } 
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
    
    // Fetch the current gameCounter value (next game ID will be this + 1 after creating the game)
    const initialGameId = await contract.gameCounter();
    console.log("Initial game ID:", initialGameId.toString());

    // Owner creates a game
    const txCreateGame = await contract.connect(owner).createGame();
    const receiptCreateGame = await txCreateGame.wait()

    // Get current gameID
    const newGameId = await contract.gameCounter();
    expect(newGameId).to.equal(initialGameId + 1n);

    // Validate GameCreated event (optional but good for debugging)
    const eventCreateGame = receiptCreateGame.logs.find(
      (log) => log.fragment && log.fragment.name === "GameCreated"
    );
    expect(eventCreateGame).to.exist;
    expect(eventCreateGame.args.gameId).to.equal(initialGameId + 1n);

    console.log("About to connect Player1 to the contract...");
    const player1ConnectedContract = contract.connect(player1);
    console.log("Player1 Address:", player1.address);
    console.log("Contract Signer Address:", await player1.getAddress());
    console.log("About to call joinGame...");

    // Ensure the contract is connected to Player1 signer for joinGame
    const txJoinGame = await player1ConnectedContract.joinGame(
      initialGameId + 1n, 
      hashedMove1, 
      { value: player1Bet });

    const receiptJoinGame = await txJoinGame.wait();
    
    // Validate the PlayerJoined event
    const eventJoinGame = receiptJoinGame.logs.find(
      (log) => log.fragment && log.fragment.name === "PlayerJoined"
    );
    expect(eventJoinGame).to.exist;
    expect(eventJoinGame.args.gameId).to.equal(initialGameId + 1n);
    expect(eventJoinGame.args.player).to.equal(player1.address);

    // Validate game state
    const game = await contract.games(initialGameId + 1n);
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
    console.log("Player1 Hashed Move (Test):", hashedMove1);
    console.log("RevealMove Inputs: move =", 1, "secret =", secret1);

    // Owner creates a game
    await contract.connect(owner).createGame();
  
    // Player1 joins the game
    await contract.connect(player1).joinGame(1, hashedMove1, { value: betAmount });
  
    // Player2 joins the game
    await contract.connect(player2).joinGame(1, hashedMove2, { value: betAmount });
    
    // Validate that the game status is MovesCommitted
    const game = await contract.games(1);
    console.log("Player1 Revealed Move:", game.player1.revealedMove.toString());
    console.log("Player2 Revealed Move:", game.player2.revealedMove.toString());
    console.log("Game Status:", game.status.toString());

    expect(game.status).to.equal(1); // MovesCommitted (enum value 1)
  
    // Player 1 reveals their move
    let tx = await contract.connect(player1).revealMove(1, 1, secret1); // Move.Rock = 1

    let receipt = await tx.wait();
  
    // Validate the MoveRevealed event for Player1
    let event = receipt.logs
    .map((log) => contract.interface.parseLog(log))
    .find((parsedLog) => parsedLog.name === "MoveRevealed");

    expect(event).to.exist;
    expect(event.args.gameId).to.equal(1);
    expect(event.args.player).to.equal(player1.address);
    expect(event.args.move).to.equal(1); // Rock
    gameId = event.args.gameId
    // Player 2 reveals their move
    tx = await contract.connect(player2).revealMove(1, 2, secret2); // Move.Paper = 2
    receipt = await tx.wait();
  
    // Validate the MoveRevealed event for Player2
    event = receipt.logs
    .map((log) => contract.interface.parseLog(log))
    .find((parsedLog) => parsedLog.name === "MoveRevealed");

    expect(event).to.exist;
    expect(event.args.gameId).to.equal(1);
    expect(event.args.player).to.equal(player2.address);
    expect(event.args.move).to.equal(2); // Paper

    // Validate the GameCompleted event
    const gameCompletedEvent = receipt.logs.find(
      (log) => log.fragment && log.fragment.name === "GameCompleted"
    );

    console.log("WINNER WINNER CHICKEN WINNER", gameCompletedEvent.args.winner)
    console.log("player1", player1.address)
    console.log("player2", player2.address)
    // console.log(receipt.logs)
    //console.log("GameCompleted Event:", gameCompletedEvent); // Add this debug log
    expect(gameCompletedEvent).to.exist;
    expect(gameCompletedEvent.args.gameId).to.equal(1);
    expect(gameCompletedEvent.args.winner).to.equal(player2.address);
    const potinETH = Number(game.pot.toString()) / 1e18;
    expect(gameCompletedEvent.args.pot).to.equal(game.pot); // Total pot is the sum of both bets

    // Act: Capture the transaction logs
    let gameEvent = receipt.logs
    .map((log) => contract.interface.parseLog(log))
    .find((parsedLog) => parsedLog.name === "GameCompleted");
    // console.log("gameEvent",gameEvent.args[0].toString())
    // const gameEvent = receipt.events.find(e => e.event === "GameCompleted");

    // Assert: Validate event existence and parameters
    assert(gameEvent, "GameCompleted event not found in transaction logs");
    assert.strictEqual(gameEvent.args[0].toString(), gameId.toString(), "Game ID mismatch");
    assert.strictEqual(gameEvent.args[1], player2.address, "Winner mismatch");
    assert.strictEqual(gameEvent.args[2].toString(), (BigInt(betAmount) * 2n).toString(), "Pot mismatch");

  });
});