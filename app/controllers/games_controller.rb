class GamesController < ApplicationController
  def index
		games = Game.all
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
