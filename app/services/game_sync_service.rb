class GameSyncService
  def initialize
    @rpc_client = @rpc_client = EthereumRpcClient.new(ENV.fetch("SEPOLIA_RPC_URL"))
    @contract_address = ENV["CONTRACT_ADDRESS"] || raise("Contract address missing!")
  end

  def sync_all_games
    latest_block = @rpc_client.eth_block_number
    from_block = latest_block - 5000 # Sync last 5000 blocks (adjust as needed)
    contract_address = ENV.fetch("CONTRACT_ADDRESS")

    logs = @rpc_client.eth_get_logs(
      from_block: from_block,
      to_block: "latest",
      address: contract_address,
      topics: ["0xEVENT_TOPIC_HASH"] # Replace with actual event topic hash
    )

    logs.each { |log| process_log(log) }
  end

  private

  def process_log(log)
    # Decode event data and store game info in the database
    event_data = decode_event(log)
    return unless event_data

    game = Game.find_or_initialize_by(game_id: event_data[:game_id])
    game.update!(
      player1_address: event_data[:player1],
      player2_address: event_data[:player2],
      pot_amount: event_data[:pot],
      status: event_data[:status]
    )

    puts "Game ##{game.game_id} synced successfully."
  end

  def decode_event(log)
    return unless log["topics"].size >= 3 && log["data"]
  
    {
      game_id: log["topics"][1].to_i(16),
      player1: "0x" + log["topics"][2][-40..],
      player2: log["topics"][3] ? "0x" + log["topics"][3][-40..] : nil, # Handle missing player2
      pot: log["data"].to_i(16) / 10**18, # Convert from wei to ETH
      status: "committed" # Update dynamically if possible
    }
  end
  
end