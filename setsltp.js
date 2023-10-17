// // // Importamos apiKey y apisecret de tus constantes
// import { apikey, apisecret } from './consts/consts.js'
export default async function makeAPICall (apiKey, apiSecret, sl, tp, posIdx, symbol) {
  const url = 'https://api.bybit.com'
  const recvWindow = 5000
  const timestamp = Date.now().toString()

  async function getSignature (parameters, secret) {
    const encoder = new TextEncoder()
    const data = encoder.encode(timestamp + apiKey + recvWindow + parameters)
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, data)
    const signatureArray = Array.from(new Uint8Array(signature))
    const signatureHex = signatureArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
    return signatureHex
  }

  async function httpRequest (endpoint, method, data, Info) {
    const sign = await getSignature(data, apiSecret)
    let fullendpoint

    if (method === 'POST') {
      fullendpoint = url + endpoint
    } else {
      fullendpoint = url + endpoint + '?' + data
      data = ''
    }

    const headers = {
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-SIGN': sign,
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow.toString()
    }

    if (method === 'POST') {
      headers['Content-Type'] = 'application/json; charset=utf-8'
    }

    const requestOptions = {
      method,
      headers
    }

    if (method === 'POST') {
      requestOptions.body = data
    }

    console.log(' SL....')

    try {
      const response = await fetch(fullendpoint, requestOptions)
      const responseData = await response.json()
      return responseData
    } catch (error) {
      console.log(error)
    }
  }

  // Resto de tu código
  const endpoint = '/v5/position/trading-stop'
  const requestData = {
    category: 'linear',
    symbol: `${symbol}`,
    positionIdx: `${posIdx}`,
    takeProfit: `${tp}`,
    stopLoss: `${sl}`,
    tpTriggerBy: 'MarkPrice',
    slTriggerBy: 'IndexPrice',
    tpslMode: 'Full',
    tpOrderType: 'market',
    slOrderType: 'market'
  }
  const data = JSON.stringify(requestData)

  await httpRequest(endpoint, 'POST', data, 'Cancel')
}

// Ahora puedes llamar a esta función desde tu archivo background.js
// Pasando los valores necesarios como argumentos

// Ejemplo de llamada desde background.js:
// const sl = '0.2'
// const tp = '1'
// const symbol = 'XRPUSDT'
// const psi = '1'

// makeAPICall(apikey, apisecret, sl, tp, psi, symbol)
