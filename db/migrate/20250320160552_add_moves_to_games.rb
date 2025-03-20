class AddMovesAndPotToGames < ActiveRecord::Migration[7.1]
  def change
    add_column :games, :player1_move, :integer
    add_column :games, :player2_move, :integer
  end
end
