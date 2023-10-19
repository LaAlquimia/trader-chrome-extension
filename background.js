import { serverUrl } from './consts/consts.js'
import handlePosition from './message.js'
import sltphttpcall from './setsltp.js'
import bybitPositions from './positions.js'

async function onChangedStorage () {
  const result = await new Promise((resolve) => {
    chrome.storage.local.get(['apikey', 'apisecret'], (data) => {
      resolve(data)
    })
  })
  const apikey = result.apikey
  const apisecret = result.apisecret
  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
      console.log(
        `Storage key "${key}" in namespace "${namespace}" changed.`,
        `Old value was "${JSON.stringify(oldValue)}", new value is "${JSON.stringify(newValue)}".`
      )
      if ((key === 'bots') && oldValue.length < newValue.length) {
        (async () => {
          const symbol = newValue[newValue.length - 1].coin
          const tp = newValue[newValue.length - 1].tp
          const sl = newValue[newValue.length - 1].sl
          console.log(symbol)
          const positions = await bybitPositions(apikey, apisecret, symbol)
          const vpos = await handlePosition(positions, tp, sl)
          console.log(JSON.parse(vpos))
          const rs = JSON.parse(vpos).map((data) => {
            if (data.size > 0) {
              const call = sltphttpcall(apikey, apisecret, data.sl, data.tp, data.positionIdx, data.symbol)
              return (call)
            }
          })
        })()
      } else if ((key === 'apikey' || key === 'apisecret') && namespace === 'local') {
      // Aquí puedes agregar la lógica para manejar los cambios en la API key o el API secret
        console.log('Se han actualizado los datos de la API')
        chrome.runtime.reload()
      }
    }
  })
}
function compareAndSetTPSL (messages) {
  for (const message of JSON.parse(messages)) {
    if (message.tp !== message.takeProfit || message.sl !== message.stopLoss) {
      setTPSL(message)
    }
  }
}

function messageFunc (event) {
  (async () => {
    const data = JSON.parse(event.data)
    console.log(data)
    const bots = await new Promise((resolve) => {
      chrome.storage.local.get(['bots'], (bots) => {
        resolve(bots.bots)
      })
    })
    if (data.data) {
      data.data.forEach(element => {
        if (element.symbol) {
          const matchingBot = bots.find((bot) => bot.coin + 'USDT' === element.symbol)
          if (matchingBot && data.data?.length) {
            // Realiza una acción basada en la verificación
            console.log('Bot running:', matchingBot)
            const fixPosition = handlePosition(data.data, matchingBot.tp, matchingBot.sl)
            console.log('position', fixPosition)
            const com = compareAndSetTPSL(fixPosition)
            console.log(com)
          }
        }
      })
    }
  })()
}

function setTPSL (message) {
  chrome.storage.local.get(['apikey', 'apisecret', 'bots'], function (result) {
    const { apikey, apisecret, bots } = result
    const isSymbolInBots = bots.some(bot => bot.coin + 'USDT' === message.symbol)
    if (isSymbolInBots) {
      console.log(message.sl, message.tp, message.positionIdx, message.symbol)
      sltphttpcall(apikey, apisecret, message.sl, message.tp, message.positionIdx, message.symbol)
    }
  })
}
export default async function getWebSocket () {
  const result = await new Promise((resolve) => {
    chrome.storage.local.get(['apikey', 'apisecret'], (data) => {
      resolve(data)
    })
  })

  const apikey = result.apikey
  const apisecret = result.apisecret
  const [expires, signature] = await generateSignature(apisecret)
  const authMessage = {
    op: 'auth',
    args: [apikey, expires, signature]
  }

  const url = serverUrl // Replace with your WebSocket URL.

  // Create a WebSocket connection.
  const ws = new WebSocket(url)

  ws.onopen = () => {
    // Authenticate with the API using the signature.
    ws.send(JSON.stringify(authMessage))
    const subscribeMessage = {
      op: 'subscribe',
      args: ['position.linear']
    }
    ws.send(JSON.stringify(subscribeMessage))
    keepAlive(ws)
  }

  ws.onmessage = (event) => {
    messageFunc(event)
  }

  ws.onclose = (event) => {
    if (event.wasClean) {
      console.log('Connection closed cleanly, code=' + event.code + ', reason=' + event.reason)
    } else {
      console.error('Connection died')
    }
  }

  ws.onerror = (error) => {
    console.error('WebSocket Error: ' + error.message)
  }

  return ws
}

async function generateSignature (apisecret) {
  // Generate expires.
  const expires = (Math.floor(Date.now() / 1000) + 5) * 1000

  // Convert the API secret key to an ArrayBuffer.
  const secretKeyBuffer = new TextEncoder().encode(apisecret)

  // Create a Uint8Array from the message to be signed.
  const message = `GET/realtime${expires}`
  const messageBuffer = new TextEncoder().encode(message)

  // Import the secret key as a crypto key.
  const key = await crypto.subtle.importKey('raw', secretKeyBuffer, { name: 'HMAC', hash: { name: 'SHA-256' } }, true, ['sign'])

  // Sign the message with the secret key.
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageBuffer)

  // Convert the signature ArrayBuffer to a hex string.
  const signature = Array.from(new Uint8Array(signatureBuffer), (byte) => {
    return ('0' + byte.toString(16)).slice(-2)
  }).join('')

  return [expires, signature]
}

function keepAlive (ws) {
  const keepAliveIntervalId = setInterval(() => {
    if (ws != null) {
      ws.send(JSON.stringify({ op: 'ping' }))
    } else {
      clearInterval(keepAliveIntervalId)
    }
  }, 20 * 1000)
}

(async () => {
  onChangedStorage()
  const ws = getWebSocket()
  console.log(ws)
})()
