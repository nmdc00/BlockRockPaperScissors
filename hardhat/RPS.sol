//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

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

  // Creating an address for each unique game and tracking number of games created for book keeping
  mapping(uint256 => Game) public games;
  uint256 public gameCounter;

  // Logs for key actions like game creation, second player joining, revealing the moves
  event GameCreated(uint256 indexed gameId, address indexed player1, uint256 betAmount);
  event PlayerJoined(uint256 indexed gameId, address indexed player2);
  event MovesCommitted(uint256 indexed gameId, address indexed player);
  event MovesRevealed(uint256 indexed gameId, address indexed player, Move move);
  event GameCompleted(uint256 indexed gameId, address indexed winner, uint256 pot);

  function createGame(bytes32 hashedMove) externable payable returns(unit256) {
    require(msg.value > 0, "Bet amount must be greater than zero");
    require(hashedMove != bytes32(0), "Move is required");
    
    gameCounter++;

    Game storage game = games[gameCounter];

    game.player1 = Player(payable(msg.sender), hashedMove, Move.None);
    game.pot = msg.value;
    game.status = GameStatus.WaitingForPlayers;

    emit GameCreated(gameCounter, msg.sender, msg.value);

    return gameCounter
  }
}