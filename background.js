import { serverUrl, sl, tp } from './consts/consts.js'
import handlePosition from './messaje.js'
import sltphttpcall from './setsltp.js'
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    )

    if ((key === 'apikey' || key === 'apisecret') && namespace === 'local') {
      // Aquí puedes agregar la lógica para manejar los cambios en la API key o el API secret

      console.log('Se han actualizado los datos de la API')
      chrome.runtime.reload()
    }
  }
})
function compareAndSetTPSL (messages) {
  for (const message of JSON.parse(messages)) {
    if (message.tp !== message.takeProfit || message.sl !== message.stopLoss) {
      setTPSL(message)
    }
  }
}

function setTPSL (message) {
  chrome.storage.local.get(['apikey', 'apisecret', 'bots'], function (result) {
    const { apikey, apisecret, bots } = result
    const isSymbolInBots = bots.some(bot => bot.coin + 'USDT' === message.symbol)
    if (isSymbolInBots) {
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
    (async () => {
      const data = JSON.parse(event.data)
      const bots = await new Promise((resolve) => {
        chrome.storage.local.get(['bots'], (bots) => {
          resolve(bots.bots)
        })
      })
      if (data.data) {
        data.data.forEach(element => {
          if (element.symbol) {
            console.log(bots)
            const matchingBot = bots.find((bot) => bot.coin + 'USDT' === element.symbol)
            if (matchingBot) {
              // Realiza una acción basada en la verificación
              console.log('Se encontró un bot con el mismo símbolo:', matchingBot)

              const position = handlePosition(data, tp, sl)
              const com = compareAndSetTPSL(position)
              // Puedes acceder a 'matchingBot.tp' y 'matchingBot.sl' si es necesario
              // Realiza las acciones deseadas aquí
            }
            // Do something with the element that has a symbol property
          }
        })
      }
    })()
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
const ws = getWebSocket()
const wss = [ws]
