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
    uint256 joinTime; // Timestamp of when the player joined
  }

  struct Game{
    Player player1; 
    Player player2;
    uint256 pot;
    uint256 betAmount;
    uint256 startTime;
    bool isActive;  
    GameStatus status;
  }

  // State variables
  address public owner; //fixed game creator address 
  // Creating an address for each unique game and tracking number of games created for book keeping
  mapping(uint256 => Game) public games;
  uint256 public gameCounter;

  //Tracking if player is already in a game
  mapping(address => uint256) public activeGame; // Track active game per player
  
  // Logs for key actions like game creation, second player joining, revealing the moves
  event GameCreated(uint256 indexed gameId, uint256 betAmount);
  // event PlayerJoined(uint256 indexed gameId, address indexed player);
  event PlayerJoined(uint256 indexed gameId, address indexed player);
  event MovesCommitted(uint256 indexed gameId, address indexed player);
  event MoveRevealed(uint256 indexed gameId, address indexed player, Move move);
  event GameCompleted(uint256 indexed gameId, address indexed winner, uint256 pot);
  event PlayerLeft(uint256 indexed gameId, address indexed player);
  event DebugLog(string message, uint256 value);

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

  function joinGame(uint256 gameId) external payable {
    require(gameId > 0, "Invalid gameID");
    require(activeGame[msg.sender] == 0, "You are already in a game!");

    Game storage game = games[gameId];
    require(game.status == GameStatus.WaitingForPlayers, "");
    require(msg.value > 0, "Must send ETH to join"); // Ensure players send ETH
    // address(0) can be used to verify whether an address has been properly initialized or assigned. 
    // If a variable holds the value address(0) it indicates that the address has not been set or is invalid, enabling smart contracts to handle such cases accordingly.
    if (game.player1.addr == address(0)) {
      game.player1 = Player(payable(msg.sender), bytes32(0), Move.None, block.timestamp);
      game.betAmount = msg.value; // ✅ Set bet amount for the game
      game.pot += msg.value;
    } else if (game.player2.addr == address(0)) {
      require(msg.sender != game.player1.addr, "Player1 cannot join again");

      require(msg.value == game.betAmount, "Player 2 must match the bet!"); // ✅ Match bet
      game.player2 = Player(payable(msg.sender), bytes32(0), Move.None, block.timestamp);

      game.pot += msg.value; // ✅ Pot = bet from both players
      game.status = GameStatus.MovesCommitted;
      game.isActive = true;
      game.startTime = block.timestamp; 

    } else {
      revert("Game already has two players");
    }
    
    activeGame[msg.sender] = gameId;
    emit PlayerJoined(gameId, msg.sender);
  }

  function leaveGame(uint256 gameId) external {
    Game storage game = games[gameId];

    require(
      msg.sender == game.player1.addr || msg.sender == game.player2.addr, 
      "You are not part of this game"
    );
    
    uint256 refundAmount = 0;

    //Player1 leaving
    if (msg.sender == game.player1.addr) {
      game.player1 = Player(payable(address(0)), bytes32(0), Move.None, 0);
      refundAmount = game.betAmount;
      game.player1.addr.transfer(refundAmount);
    }

    //Player2 leaving
    if (msg.sender == game.player2.addr) {
      game.player2 = Player(payable(address(0)), bytes32(0), Move.None, 0);
      refundAmount = game.betAmount;
      game.player2.addr.transfer(refundAmount);
    }
    
    //Refund pot if both players leave
    if (game.pot >= refundAmount) {
      game.pot -= refundAmount;
    }
    
    // Reset game status if no players are left
    if (game.player1.addr == address(0) && game.player2.addr == address(0)) {
        game.status = GameStatus.WaitingForPlayers;
        game.pot = 0;
        game.betAmount = 0;
        game.isActive = false;
    }

    activeGame[msg.sender] = 0;

    emit PlayerLeft(gameId, msg.sender);
  }
  function commitMove(uint256 gameId, bytes32 hashedMove) external {
    Game storage game = games[gameId];

    require(game.isActive, "Game is not active");
    // require(block.timestamp <= game.startTime + 2 minutes, "Game timed out");
    require(game.status == GameStatus.MovesCommitted, "Game is not accepting moves");
    require(
      msg.sender == game.player1.addr || msg.sender == game.player2.addr,
        "Only players in the game can commit moves"
      );

      Player storage player = msg.sender == game.player1.addr ? game.player1 : game.player2;
      require(player.hashedMove == bytes32(0), "Move already committed");

      player.hashedMove = hashedMove;
      emit MovesCommitted(gameId, msg.sender);
    }

  function revealMove(uint256 gameId, Move move, string memory secret) external {
    Game storage game = games[gameId];

    require(game.status == GameStatus.MovesCommitted, "Game is not in reveal phase");

    require(
        msg.sender == game.player1.addr || msg.sender == game.player2.addr,
        "Only players in the game can reveal moves"
    );

    Player storage player = msg.sender == game.player1.addr ? game.player1 : game.player2;
    require(player.revealedMove == Move.None, "Move already revealed");

    bytes32 expectedHash = keccak256(abi.encode(move, secret));

    if (block.timestamp > player.joinTime + 10 && player.hashedMove == bytes32(0)) {
        player.revealedMove = Move.Rock; // Default to Rock if time expired
    } else {
        require(expectedHash == player.hashedMove, "Invalid move or secret");
        player.revealedMove = move;
    }

    emit MoveRevealed(gameId, msg.sender, player.revealedMove);

    if (game.player1.revealedMove != Move.None && game.player2.revealedMove != Move.None) {
        determineWinner(gameId);
    }
    emit DebugLog("Player 1 Move", uint256(game.player1.revealedMove));
    emit DebugLog("Player 1 Move", uint256(game.player1.revealedMove));

  }

  event DebugLog(string message, address addr);

  function determineWinner(uint256 gameId) private {
    Game storage game = games[gameId];
    
    require(game.player1.revealedMove != Move.None, "Player1 move not revealed");
    require(game.player2.revealedMove != Move.None, "Player2 move not revealed");

    address payable winner = payable(address(0)); // Default to no winner
    
    //Draw
    if (game.player1.revealedMove == game.player2.revealedMove) {
      uint256 halfPot = game.pot / 2;
      if (halfPot > 0) {
        payable(game.player1.addr).transfer(halfPot);
        payable(game.player2.addr).transfer(halfPot);
      }
      emit GameCompleted(gameId, winner, game.pot);
    }
    //Player1 wins
    else if (
      (game.player1.revealedMove == Move.Rock && game.player2.revealedMove == Move.Scissors) ||
      (game.player1.revealedMove == Move.Scissors && game.player2.revealedMove == Move.Paper ) ||
      (game.player1.revealedMove == Move.Paper && game.player2.revealedMove == Move.Rock)
    ) {
      //Player1 wins
      winner = game.player1.addr;
    } else {
      //Player2 wins
      winner = game.player2.addr;
    }

    if (winner != address(0)) {
      payable(winner).transfer(game.pot);
    }

    emit GameCompleted(gameId, winner, game.pot);

    // Reset game
    game.status = GameStatus.Completed;
    game.isActive = false;
    game.pot = 0;
    activeGame[game.player1.addr] = 0;
    activeGame[game.player2.addr] = 0;
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