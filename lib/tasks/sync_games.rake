namespace :sync do
  desc "Sync games from blockchain"
  task games: :environment do
    puts "Starting game sync..."
    GameSyncService.new.sync_all_games
    puts "Game sync complete."
  end
end
