class Game < ApplicationRecord
    validates :bet_amount, presence: true, numericality: { greater_than: 0}
    validates :player1_move, inclusion: { in: %w[Rock Paper Scissors], allow_nil: true }
    validates :player2_move, inclusion: { in: %w[Rock Paper Scissors], allow_nil: true }

    def determine_winner
      return nil if player1_move.blank? || player2_move.blank?

      if player1_move == player2_move
        nil
      elsif  
        player1_move == 'Rock' && player2_move == 'Scissors' ||
        player1_move == 'Scissors' && player2_move == 'Paper' ||
        player1_move == 'Rock' && player2_move == 'Scissors'

        player1
      else
        player2
      end
    end
end
