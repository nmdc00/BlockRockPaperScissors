# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2025_03_20_160552) do
  create_table "games", force: :cascade do |t|
    t.bigint "game_id", null: false
    t.string "player1_address", null: false
    t.string "player2_address"
    t.integer "player1_move"
    t.integer "player2_move"
    t.string "winner"
    t.string "status", default: "waiting"
    t.decimal "pot_amount", precision: 18, scale: 8
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["game_id"], name: "index_games_on_game_id", unique: true
  end

end
