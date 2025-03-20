require 'faraday'
require 'json'

class EthereumRpcClient
  def initialize(rpc_url = ENV.fetch("INFURA_RPC_URL", nil))

    raise "Ethereum RPC URL not set!" unless rpc_url
    
    @conn = Faraday.new(url: rpc_url)
  end

  def eth_block_number
    request('eth_blockNumber')['result'].to_i(16)
  end

  def eth_get_logs(from_block:, to_block:, address:, topics:)
    from_block_hex = "0x#{from_block.to_s(16)}"
    to_block_hex = to_block == "latest" ? "latest" : "0x#{to_block.to_s(16)}"
  
    params = {
      fromBlock: from_block_hex,
      toBlock: to_block_hex,
      address: address,
      topics: topics
    }
    request('eth_getLogs', [params])['result']
  end

  def keccak256(input)
    request('web3_sha3', [input])['result']
  end

  def eth_call(to:, data:)
    params = [{ to: to, data: data }, "latest"]
    request("eth_call", params)["result"]
  end
  
  def get_game_count(contract_address)
    encoded_data = "0x70a08231" # Keccak-256 hash of getGameCount()
    result = eth_call(to: contract_address, data: encoded_data)
    result.to_i(16)
  end
  
  private

  def request(method, params = [])
    payload = { jsonrpc: '2.0', id: 1, method: method, params: params }
    response = @conn.post('', JSON.dump(payload), 'Content-Type' => 'application/json')
  
    json_response = JSON.parse(response.body)
    
    if json_response["error"]
      raise "Ethereum RPC Error: #{json_response['error']['message']}"
    end
  
    json_response
  rescue Faraday::ConnectionFailed => e
    raise "Ethereum RPC Connection Failed: #{e.message}"
  rescue JSON::ParserError
    raise "Ethereum RPC Response was not valid JSON"
  end
  
end
