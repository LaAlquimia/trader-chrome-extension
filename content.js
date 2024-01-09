/* eslint-disable no-undef */
const ui = document.createElement('div')
ui.innerHTML = `
<div class="top-bar">
<div class="top-bar-button" id="login">Username</div>
</div>

<div class="content-container">
<div class="left-bar">
    <button id="botsButton"></button>
    <button id="configPage"></button>
</div>

<div class="content-window" id="mainContent">
    <div class="bot-grid" id="botsContent">
    <div class="myCard" id="addBot">
    <div class="innerCard">
        <div class="frontSide">
            <h2 class="titleCard">LA ALQUIMIA</h2>
            <p>SL TP BOT 🐢</p>
        </div>
        <div class="backSide">
            <p class="titleCard">Add BOT</p>
            <h3>Stop LOSS in 💲</h3>
            <input type="number" min="0" id="slInput" placeholder="SL" value="1">
            <h3>Take PROFIT in 💲</h3>
            <!-- Campo de entrada numérico para SL con valor predeterminado "1" -->
            <input type="number" min="0" id="tpInput" placeholder="TP" value="1">
            <!-- Campo de entrada numérico para TP con valor predeterminado "1" -->
            <button class="addBot" id = "addBotButton">Addbot</button>
        </div>
    </div>
</div>

    </div>

    <div class="config-grid" id="configContent" style="display: none;">
        <div class="input-card">
            <span class="input-card__title">Api Keys</span>
            <div class="input-card__form">
                <select id="exchange_input">
                    <option value="bybit">Bybit</option>
                    <option value="binance">Binance On Next version</option>
                </select>                
                <span class="apikey_span">Api Key</span>
                <input placeholder="Api Key here" type="text" id="apikey_input">
                <span class="apikey_span">Api Secret </span>
                <input placeholder="Api secret here" type="password" id="apisecret_input">
                <button class="sign-up" id="setApis"> Save</button>
            </div>
        </div>
    </div>
</div>
</div>
`
function setBotSlTp (symbol) {
  console.log('addbot verify sl and tp')
}
const apikeyInput = document.createElement('apikeyInput')
apikeyInput.innerHTML = ''

function showOverlayMessage (message) {
  const overlay = document.getElementById('alq-overlay')
  const content = document.getElementById('mainContent')
  const data = JSON.parse(message)
  const table = document.createElement('table')
  table.style.margin = 'auto'
  table.style.borderCollapse = 'collapse'

  // Crea la fila de encabezado de la tabla
  const headerRow = document.createElement('tr')
  for (const key in data[0]) {
    const th = document.createElement('th')
    th.style.padding = '16px'
    th.style.border = '0px solid #ddd'
    th.textContent = key
    headerRow.appendChild(th)
  }
  table.appendChild(headerRow)

  // Crea las filas de datos de la tabla
  data.forEach((item) => {
    const row = document.createElement('tr')
    for (const key in item) {
      const td = document.createElement('td')
      td.style.padding = '16px'
      td.style.border = '0px solid #ddd'
      td.textContent = item[key]
      row.appendChild(td)
    }
    table.appendChild(row)
  })

  // Reemplaza el contenido anterior con la nueva tabla
  content.innerHTML = ''
  content.appendChild(table)

  // Muestra el overlay si está oculto
  if (overlay.style.display === 'none') {
    overlay.style.display = ''
  }
}
(async () => {
  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      console.log(sender.tab
        ? 'from a content script:' + sender.tab.url
        : 'from the extension')
      console.log(request)
      sendResponse({ message: 'ok' })
    }
  )
  const addedALQ = false // Variable para rastrear alq
  window.onload = () => {
    const parentNode = document.getElementById('guidance_anchor_position')
    const bycardParent = parentNode.querySelector('.by-card')
    const cardBody = parentNode.querySelector('.by-card__body')
    const overlay = document.createElement('span')
    const content = document.createElement('span')
    content.textContent = 'Building ⚠️⚒️'
    content.id = 'contentTable'
    overlay.appendChild(content)
    ui.id = 'alq-overlay'
    bycardParent.appendChild(ui)
    const addBotCard = document.getElementById('addBot')
    ui.style.display = 'none'
    // `document.querySelector` may return null if the selector doesn't match anything.
    if (!addedALQ) {
      const bar = document.getElementsByClassName('position__header--title--left')[0]
      const alqButton = document.createElement('span')
      alqButton.textContent = 'ALQ'
      alqButton.classList.add('position_header_title_span')
      alqButton.classList.add('active')
      alqButton.id = 'alq-button'
      // Insertar "ALQ" como segundo elemento.
      if (bar.childNodes.length > 1) {
        bar.insertBefore(alqButton, bar.childNodes[1])
      } else {
        bar.appendChild(alqButton)
      }
      alqButton.addEventListener('click', () => {
        // crear un condicional entre '' y 'none'
        if (ui.style.display === 'none') {
          ui.style.display = ''
        } else {
          ui.style.display = 'none'
        }
      })
    }
    chrome.storage.local.get({ bots: [] }, function (result) {
      const bots = result.bots
      console.log(`Estos son los bots existentes: ${JSON.stringify(bots)}`)

      // Obtén el contenedor donde deseas agregar las tarjetas
      const cardsContainer = document.getElementById('botsContent')

      // Recorre los bots y crea una tarjeta para cada uno
      bots.forEach((bot, index) => {
        const card = document.createElement('div')
        card.classList.add('myCard') // Agrega las clases CSS necesarias

        // Agrega el contenido de la tarjeta con la información del bot
        card.innerHTML = `
        <div class="innerCard">
      <div class="frontSide">
          <h2 class="titleCard">${bot.coin}</h2>
          <p>Bot Running</p>
      </div>
      <div class="backSide">
          <h2 class="titleCard">${bot.coin}</h2>
          <p>SL ${bot.sl} 💲</p>
          <p>TP ${bot.tp} 💲</p>
          <div class="closeButtonContainer">
            <button id="close_card" class="closeCard">x</button>
            </div>
      </div>
  </div>
        `
        //         <h2></h2>
        //         <p>Moneda: ${bot.coin}</p>
        //         <div class="closeButtonContainer">
        //     <button id="close_card" class="closeCard">x</button>
        // </div>
        //       </div>
        //     `

        // Agrega un identificador único a cada tarjeta (opcional)
        card.id = `card${bot.coin}`

        // Agrega la tarjeta al contenedor
        cardsContainer.insertBefore(card, addBotCard)
      })
      // aqui se a;ade la tarjeta de anadir bot al contenedor al final
    })
    chrome.storage.local.get(['apikey', 'apisecret'], function (result) {
      const apikey = result.apikey
      const apisecret = result.apisecret
      const apikeyInput = document.getElementById('apikey_input')
      const apisecretInput = document.getElementById('apisecret_input')
      apikeyInput.value = apikey
      apisecretInput.value = apisecret
    })
    function addBotSetsl () {
      const card = document.createElement('div')
      const cardsContainer = document.getElementById('botsContent')
      card.className = 'card'
      // Crear una "x" en la parte superior derecha de la tarjeta
      // Agregar un evento click para eliminar la tarjeta
      // Agregar el icono de "x" a la tarjeta
      // Agregar la tarjeta al contenedor
      const coin = document.URL.split('.bybit.com/trade/usdt/')[1].split('USDT')[0]
      const tp = document.getElementById('tpInput').value
      const sl = document.getElementById('slInput').value
      const config = 'TPSL'
      chrome.storage.local.get({ bots: [] }, function (result) {
        const bots = result.bots
        console.log(`Estos son los bots existentes: ${JSON.stringify(bots)}`)
        const lenBots = bots.length
        // Verificar si la moneda ya está en la lista
        if (!bots.some(bot => bot.coin === coin) && lenBots < 6) {
          // Si no existe, agregar el nuevo bot a la lista
          bots.push({ coin, config, tp, sl })

          // Actualizar los datos en el almacenamiento local
          chrome.storage.local.set({ bots }, function () {
            // Esto se ejecutará después de guardar los datos
            card.classList.add('myCard')
            card.id = `card${coin}`
            card.innerHTML = `<div class="innerCard">
            <div class="frontSide">
                <p class="titleCard">${coin}</p>
                <p>BOT ON</p>
            </div>
            <div class="backSide">
                <p class="titleCard">${coin}</p>
                <p>SL ${sl} 💲</p>
                <p>TP ${tp} 💲</p>
                <div class="closeButtonContainer">
            <button id="close_card" class="closeCard">x</button>
            </div>
                
            </div>
            </div>`
            cardsContainer.insertBefore(card, addBotCard)
            setBotSlTp(coin)
            // Si alcanzamos 6 tarjetas, eliminamos la capacidad de hacer clic
            console.log(`BOT ${coin} ha sido agregado a la lista de bots.`)
          })
        } else {
          console.log(`El BOT ${coin} ya existe en la lista de bots.`)
        }
      })
    }
    document.addEventListener('click', (e) => {
      if (e.target.className === 'addBot') {
        addBotSetsl()
      } else if (e.target.id === 'botsButton') {
        botsContent.style.display = 'grid'
        configContent.style.display = 'none'
      } else if (e.target.id === 'close_card') {
        const card = e.target.parentElement.parentElement.parentElement.parentElement
        const cardcoin = card.id.split('card')[1]

        chrome.storage.local.get({ bots: [] }, function (result) {
          const bots = result.bots

          // Busca el índice del bot con el atributo "coin" igual a "cardcoin"
          const intidx = bots.findIndex(bot => bot.coin === cardcoin)

          if (intidx >= 0) {
            // Elimina el elemento correspondiente en la lista de bots
            bots.splice(intidx, 1)

            // Actualiza los datos en chrome.storage.local
            chrome.storage.local.set({ bots }, function () {
              console.log(`BOT con coin "${cardcoin}" ha sido eliminado de la lista de bots.`)
            })
          } else {
            console.log(`No se encontró un BOT con coin "${cardcoin}".`)
          }
        })

        card.remove()
      } else if (e.target.id === 'configPage') {
        configContent.style.display = 'flex'
        botsContent.style.display = 'none'
      } else if (e.target.id === 'setApis') {
        const apikey = document.getElementById('apikey_input').value
        const apisecret = document.getElementById('apisecret_input').value
        chrome.storage.local.set({ apikey, apisecret }).then(() => {
          alert('Se han actualizado los datos de la API')
          window.location.reload()
        })
      }
    })
  }
})()
