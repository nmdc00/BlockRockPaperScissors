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
}