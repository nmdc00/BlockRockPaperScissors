class GamesController < ApplicationController
  def index
		game = Game.all.map do |game|
			{
				game_id: game.game_id,
				player_count: game.player2_address.nil? ? 1 : 2,
				pot_amount: game.pot_amount.to_f,
				status: game.status
			}
		end

	render json: games
	end

	def show
		game = Game.find_by(game_id: params[:id])
	
		if game
			render json: {
				game_id: game.game_id,
				player1_address: game.player1_address,
				player2_address: game.player2_address,
				pot_amount: game.pot_amount.to_f,
				status: game.status
			}
		else
			render json: { error: "Game not found" }, status: :not_found
		end
	end
end
