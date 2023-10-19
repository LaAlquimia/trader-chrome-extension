function decim (numero) {
  const numeroStr = String(numero)
  const decimales = numeroStr.length - numeroStr.indexOf('.') - 1
  return decimales
}
export default function handlePosition (message, tpqty, slqty, config) {
  console.log('message', message)
  const result = message.map((dataMsg) => {
    const { symbol, entryPrice, size, stopLoss, side, takeProfit, positionIdx } = dataMsg
    const parsedEntryPrice = parseFloat(entryPrice)
    const d = decim(parsedEntryPrice)
    let sl = 0
    let tp = 0
    if (size === 0) {
      console.log('posicion 0')
    }

    if (positionIdx === 1 || positionIdx === 2) {
      if (positionIdx === 1) {
        sl = Number((parsedEntryPrice - (slqty / size)).toFixed(d))
        tp = Number((parsedEntryPrice + (tpqty / size)).toFixed(d))
      } else {
        sl = Number((parsedEntryPrice + (slqty / size)).toFixed(d))
        tp = Number((parsedEntryPrice - (tpqty / size)).toFixed(d))
      }
    } else if (positionIdx === 0) {
      if (side === 'Buy') {
        sl = Number((parsedEntryPrice - (slqty / size)).toFixed(d))
        tp = Number((parsedEntryPrice + (tpqty / size)).toFixed(d))
      } else {
        sl = Number((parsedEntryPrice + (slqty / size)).toFixed(d))
        tp = Number((parsedEntryPrice - (tpqty / size)).toFixed(d))
      }
    } else {
      throw new Error('Invalid side value: ' + side)
    }

    return {
      symbol,
      positionIdx,
      size,
      entryPrice: parsedEntryPrice,
      stopLoss, // Utiliza el stopLoss del mensaje
      takeProfit, // Utiliza el takeProfit del mensaje
      sl,
      tp
    }
  }).filter(Boolean)

  return JSON.stringify(result)
}
