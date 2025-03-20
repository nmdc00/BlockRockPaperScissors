class AddMovesToGames < ActiveRecord::Migration[7.1]
  def change
    change_column :games, :player1_move, :integer
    change_column :games, :player2_move, :integer
  end
end
