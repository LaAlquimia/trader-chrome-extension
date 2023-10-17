// Importamos apiKey y apisecret de tus constantes
import { apikey, apisecret, serverUrl, sl, tp } from './consts/consts.js'

const url = 'https://api.bybit.com'
const apiKey = apikey
const secret = apisecret
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

async function http_request (endpoint, method, data, Info) {
  const sign = await getSignature(data, secret)
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

  console.log(Info + ' Calling....')

  try {
    const response = await fetch(fullendpoint, requestOptions)
    const responseData = await response.json()
    console.log(JSON.stringify(responseData))
  } catch (error) {
    console.log(error)
  }
}

// Resto de tu código

const endpoint = '/v5/order/cancel-all'
const data =
JSON.stringify({
  category: 'linear',
  symbol: null,
  settleCoin: 'USDT'
})
await http_request(endpoint, 'POST', data, 'Cancel')
