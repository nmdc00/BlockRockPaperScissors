class Game < ApplicationRecord

    enum status: { waiting: 0, commited: 1, completed: 2}
    enum player1_move: { block: 1, paper: 2, scissors: 3}, _prefix: :player1
    enum player2_move: { block: 1, paper: 2, scissors: 3}, _prefix: :player2

    validates :game_id, presence: true, uniqueness: true
    validates :pot_amount, presence: true, numericality: { greater_than: 0}
    validates :player1_address, presence: true, uniqueness: true 
    validates :player1_move, inclusion: { in: %w[Block Paper Scissors], allow_nil: true }
    validates :player2_move, inclusion: { in: %w[Block Paper Scissors], allow_nil: true }

    def determine_winner
      return nil if player1_move.blank? || player2_move.blank?

      if player1_move == player2_move
        nil
      elsif  
        player1_move == 'Block' && player2_move == 'Scissors' ||
        player1_move == 'Scissors' && player2_move == 'Paper' ||
        player1_move == 'Block' && player2_move == 'Scissors'

        player1
      else
        player2
      end
    end
    
    def formatted_pot
      pot_amount ? "#{pot_amount} ETH" : "Pending"
    end
  
    def player_count
      [player1_address, player2_address].compact.count
    end
  
    def display_info
      if player_count == 1
        "Game ##{game_id}: 1/2 Players | Bet: #{bet_amount} ETH"
      else
        "Game ##{game_id}: 2/2 Players | Pot: #{formatted_pot}"
      end
    end
  end
end
