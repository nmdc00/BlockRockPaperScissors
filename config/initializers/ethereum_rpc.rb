if File.exist?(Rails.root.join('config/lib/ethereum_rpc_client.rb')) && ENV['SEPOLIA_RPC_URL'].present?
  require Rails.root.join('config/lib/ethereum_rpc_client')
  ETHEREUM_CLIENT = EthereumRpcClient.new(ENV['SEPOLIA_RPC_URL'])
end
