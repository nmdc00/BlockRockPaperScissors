class CreateGames < ActiveRecord::Migration[7.1]
  def change
    create_table :games do |t|
      t.bigint :game_id, null: false
      t.string :player1_address, null: false
      t.string :player2_address, null: true
      t.string :player1_move
      t.string :player2_move
      t.string :winner
      t.string :status, default: 'waiting'
      t.decimal :pot_amount, precision: 18, scale: 8

      t.timestamps
    end

    add_index :games, :game_id, unique: true
  end
end
