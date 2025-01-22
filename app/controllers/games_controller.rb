class GamesController < ApplicationController
    def index
			@games = Game.all
		end

		def new
			@game = Game.new
		end

		def create
			@game = Game.new(game_params)
			@game.status = 'WaitingForPlayers'

			if @game.save
				redirect_to games_path, notice: 'Game created successfully'
			else
				render :new, status: :unprocessable_entity
			end
		end

		def join 
			@game = Game.find(params[:id])
			if @game.player.nil?
				@game.update(player1: params[:player_address])
			elsif @game.player2.nil?
				@game.update(player2: params[:player_address], status: 'MovesCommitted')
			else
				redirect_to games_path, alert: 'Game is full!' and return
			end

			redirect_to games_path, notice: 'Player joined sucessfully'
		end

		def commit_move
			@game = Game.find(params[:id])
			if params[:player_address] == @game.player1
				@game.update(player1_move: params[:move])
			elsif params[:players_address] == @game.player2
				@game.update(player2_move: params[:move])
			else
				redirect_to games_path, alert: 'Invalid player address' and return
			end
		end 

		private

		def game_params
			params.require(:game).permit(:bet_amount)
		end

		def finalize_game(game)
			winner = game.determine_winner
			#pot ammount should be sum of the two bets
			if winner 
				game.update(winner: winner, status: 'Completed')
			else
				game.update(status('Completed', winner: 'Draw'))
			end
		end
end
