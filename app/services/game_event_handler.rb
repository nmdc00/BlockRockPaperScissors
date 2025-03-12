class GameEventHandler
  def self.handle_player_joined(game_id, player_address, hashed_move, bet_amount)
    game = Game.find_or_initialize_by(game_id: game_id)

    if game.player1_address.nil?
      game.player1_address = player_address
      game.bet_amount = bet_amount
      game.save!
      puts "Saved player1 for game #{game_id}"
    elsif game.player2_address.nil? && game.player1_address.downcase != player_address.downcase
      game.player1_address = player_address
      game.status = 'commited'
      game.save!
      puts "Game #{game_id} ready, both players joined"
    else
      Rails.logger.warn "Player already in game or duplicate: #{player_address} for game #{game_id}"
    end

    def self.handle_game_completed(game_id, winner, pot)
      game = Game.find_by(game_id: game_id)
      return unless game
      
      game.winner = winner
      game.pot = pot
      game.status = 'completed'
      game.save!

      puts "Game #{game_id} completed. Winner: #{winner}, Pot: #{pot} ETH"
end