// import { apikey, apisecret } from './consts/consts.js'

export default async function bybitPositions (apikey, apisecret, symbol) {
  return new Promise(async (resolve, reject) => {
    const url = 'https://api.bybit.com'
    const recvWindow = 5000
    const timestamp = Date.now().toString()

    async function generateGetSignature (queryString, apisecret) {
      const encoder = new TextEncoder()
      const data = encoder.encode(timestamp + apikey + recvWindow + queryString)
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(apisecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const signature = await crypto.subtle.sign('HMAC', key, data)
      const signatureArray = Array.from(new Uint8Array(signature))
      const signatureHex = signatureArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
      return signatureHex
    }

    async function httpget (endpoint, queryString) {
      const signature = await generateGetSignature(queryString, apisecret)
      const fullEndpoint = url + endpoint + '?' + queryString

      const headers = {
        'X-BAPI-SIGN-TYPE': '2',
        'X-BAPI-SIGN': signature,
        'X-BAPI-API-KEY': apikey,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow.toString()
      }

      try {
        const response = await fetch(fullEndpoint, { method: 'GET', headers })
        const responseData = await response.json()

        const positions = responseData.result.list.map(item => ({
          positionIdx: item.positionIdx,
          size: item.size,
          side: item.side,
          entryPrice: item.avgPrice,
          stopLoss: item.stopLoss,
          takeProfit: item.takeProfit,
          symbol: item.symbol
        }))

        return positions
      } catch (error) {
        console.log(error)
        return []
      }
    }

    const endpoint = '/v5/position/list'
    const queryString = `category=linear&symbol=${symbol}USDT`

    try {
      const positions = await httpget(endpoint, queryString)
      resolve(positions)
    } catch (error) {
      reject(error)
    }
  })
}
