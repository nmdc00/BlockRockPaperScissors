require 'faraday'
require 'json'

class EthereumRpcClient
  def initialize(rpc_url)
    @conn = Faraday.new(url: rpc_url)
  end

  def eth_block_number
    request('eth_blockNumber')['result'].to_i(16)
  end

  def eth_get_logs(from_block:, to_block:, address:, topics:)
    params = {
      fromBlock: "0x#{from_block.to_s(16)}",
      toBlock: "0x#{to_block.to_s(16)}",
      address: address,
      topics: topics
    }
    request('eth_getLogs', [params])['result']
  end

  def keccak256(input)
    request('web3_sha3', [input])['result']
  end

  private

  def request(method, params = [])
    payload = {
      jsonrpc: '2.0',
      id: 1,
      method: method,
      params: params
    }
    response = @conn.post('', JSON.dump(payload), 'Content-Type' => 'application/json')
    JSON.parse(response.body)
  end
end
