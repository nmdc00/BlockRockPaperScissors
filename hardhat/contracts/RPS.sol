//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";

contract RockPaperScissors {
  // enum = user-defined data type consisting of a ser of named values, called members
  enum Move { None, Rock, Paper, Scissors }
  enum GameStatus { WaitingForPlayers, MovesCommitted, Completed }

  // structs bundle complex data. Functions a bit like a class for OOP languages I feel but in a functional way. Kinda the same way we define models in Ruby
  struct Player {
    // Solidity 101 payable let's addresses receive and sed ether
    address payable addr; 
    bytes32 hashedMove;
    Move revealedMove;
  }

  struct Game{
    Player player1; 
    Player player2;
    uint256 pot;
    GameStatus status;
  }

  // State variables
  address public owner; //fixed game creator address 
  // Creating an address for each unique game and tracking number of games created for book keeping
  mapping(uint256 => Game) public games;
  uint256 public gameCounter;

  // Logs for key actions like game creation, second player joining, revealing the moves
  event GameCreated(uint256 indexed gameId, uint256 betAmount);
  // event PlayerJoined(uint256 indexed gameId, address indexed player);
  event PlayerJoined(uint256 indexed gameId, address indexed player, bytes32 hashedMove, uint256 betAmount);
  event MovesCommitted(uint256 indexed gameId, address indexed player);
  event MoveRevealed(uint256 indexed gameId, address indexed player, Move move);
  event GameCompleted(uint256 indexed gameId, address indexed winner, uint256 pot);

  // Owner restriction modifier
  modifier onlyOwner() {
    require(msg.sender == owner, "Only the owner can create games");
    _;
  }

  // Constructor to initialize the owner
  constructor() {
    owner = msg.sender;
  }

  function createGame() external returns (uint256) {

    gameCounter++;

    Game storage game = games[gameCounter];

    game.pot = 0;
    game.status = GameStatus.WaitingForPlayers;

    emit GameCreated(gameCounter, 0);

    return gameCounter;
  }

  function joinGame(uint256 gameId, bytes32 hashedMove) external payable {
    Game storage game = games[gameId];

    require(game.status == GameStatus.WaitingForPlayers, "Game is not waiting for players");
    require(msg.value > 0, "Bet amount must be greater than 0");
    require(hashedMove != bytes32(0), "Hashed move is required");

    // address(0) can be used to verify whether an address has been properly initialized or assigned. 
    // If a variable holds the value address(0) it indicates that the address has not been set or is invalid, enabling smart contracts to handle such cases accordingly.
    if (game.player1.addr == address(0)) {
      game.player1 = Player(payable(msg.sender), hashedMove, Move.None);
      game.pot += msg.value;
      emit PlayerJoined(gameId, msg.sender, hashedMove, msg.value); // Emit hashedMove for debugging
    } else if (game.player2.addr == address(0)) {
      require(msg.sender != game.player1.addr, "Player1 cannot join again");
      require(msg.value == game.pot, "Bet amount must match Player1's bet");
      game.player2 = Player(payable(msg.sender), hashedMove, Move.None);
      game.pot += msg.value;
      game.status = GameStatus.MovesCommitted;
      emit PlayerJoined(gameId, msg.sender, hashedMove, msg.value);
    } else {
      revert("Game already has two players");
    }
    
    // emit PlayerJoined(gameId, msg.sender);
  }

  function revealMove(uint256 gameId, Move move, string memory secret) external {
    Game storage game = games[gameId];

    require(game.status == GameStatus.MovesCommitted, "Game is not in reveal phase");

    require(move != Move.None, "Invalid move");

    require (
      msg.sender == game.player1.addr || msg.sender == game.player2.addr,
      "Only game participants can reveal moves"
    );

    // Identify the player and ensure they haven't already revealed their move
    Player storage player = msg.sender == game.player1.addr ? game.player1 : game.player2;
    require(player.revealedMove == Move.None, "Move already revealed");

    bytes32 expectedHash = keccak256(abi.encode(move, secret));

    require(
    expectedHash == player.hashedMove,
        string.concat(
            "Move does not match. Expected: ",
            Strings.toHexString(uint256(player.hashedMove)), // Correctly cast bytes32
            " Got: ",
            Strings.toHexString(uint256(expectedHash)) // Correctly cast bytes32
        )
    );

    // If checks pass, update the revealed move
    player.revealedMove = move;

    emit MoveRevealed(gameId, msg.sender, move);

    // Check if both players have revealed their moves
    if (game.player1.revealedMove != Move.None && game.player2.revealedMove != Move.None) {
        determineWinner(gameId);
    }
  }

  function determineWinner(uint256 gameId) private {
    Game storage game = games[gameId];
    
    require(game.player1.revealedMove != Move.None, "Player1 move not revealed");
    require(game.player2.revealedMove != Move.None, "Player2 move not revealed");

    address payable winner = payable(address(0)); // Default to no winner

    if (game.player1.revealedMove == game.player2.revealedMove) {
      game.player1.addr.transfer(game.pot / 2);
      game.player2.addr.transfer(game.pot / 2);
    }
    else if (
      (game.player1.revealedMove == Move.Rock && game.player2.revealedMove == Move.Scissors) ||
      (game.player1.revealedMove == Move.Scissors && game.player2.revealedMove == Move.Paper ) ||
      (game.player1.revealedMove == Move.Paper && game.player2.revealedMove == Move.Rock)
    ) {
      winner = game.player1.addr;
      winner.transfer(game.pot);
    } else {
      winner = game.player2.addr;
      winner.transfer(game.pot);
    }
    
    emit GameCompleted(gameId, winner, game.pot);
    game.status = GameStatus.Completed;
  }

  function getPlayerCount(uint256 gameId) public view returns (uint256) {
    Game storage game = games[gameId];
    uint256 count = 0;

    if (game.player1.addr != address(0)) {
        count++;
    }
    if (game.player2.addr != address(0)) {
        count++;
    }

    return count;
  }

}