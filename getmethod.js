// Importa apikey y apisecret desde tus constantes
import { apikey, apisecret } from './consts/consts.js'
async function bybitPositions (apikey, apisecret, symbol) {
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

  async function http_get (endpoint, queryString, Info) {
    const signature = await generateGetSignature(queryString, apisecret)
    const fullEndpoint = url + endpoint + '?' + queryString

    const headers = {
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-SIGN': signature,
      'X-BAPI-API-KEY': apikey,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow.toString()
    }

    console.log(Info + ' Calling....')

    try {
      console.log(fullEndpoint)
      const response = await fetch(fullEndpoint, { method: 'GET', headers })
      const responseData = await response.json()
      console.log(JSON.stringify(responseData))
    } catch (error) {
      console.log(error)
    }
  }

  // Ejemplo de uso
  const endpoint = '/v5/user/get-member-type'
  const queryString = ''

  return(http_get(endpoint, queryString, 'Get'))
}

bybitPositions(apikey, apisecret, 'BTCUSDT')