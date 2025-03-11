require Rails.root.join('config/lib/ethereum_rpc_client')

ETHEREUM_CLIENT = EthereumRpcClient.new(ENV.fetch('SEPOLIA_RPC_URL'))
