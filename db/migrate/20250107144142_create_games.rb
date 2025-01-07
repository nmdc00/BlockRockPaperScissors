class CreateGames < ActiveRecord::Migration[7.1]
  def change
    create_table :games do |t|
      t.string :player1
      t.string :player2
      t.string :player1_move
      t.string :player2_move
      t.string :winner
      t.string :status
      t.decimal :bet_amount
      t.decimal :pot_amount

      t.timestamps
    end
  end
end
