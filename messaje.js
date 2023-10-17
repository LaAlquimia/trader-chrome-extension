function decim (numero) {
  const numeroStr = String(numero)
  const decimales = numeroStr.length - numeroStr.indexOf('.') - 1
  return decimales
}
export default  function handlePosition (message, expoLong, expoShort, config) {
  if (message.data?.length) {
    const result = message.data.map((dataMsg) => {
      const { symbol, entryPrice, size, stopLoss, side, takeProfit, positionIdx } = dataMsg
      const parsedEntryPrice = parseFloat(entryPrice)
      const d = decim(parsedEntryPrice)
      let sl = 0
      let tp = 0

      if (positionIdx === 1 || positionIdx === 2) {
        if (size > 0) {
          if (positionIdx === 1) {
            sl = Number((parsedEntryPrice - (expoShort / size)).toFixed(d))
            tp = Number((parsedEntryPrice + (expoLong / size)).toFixed(d))
          } else {
            sl = Number((parsedEntryPrice + (expoShort / size)).toFixed(d))
            tp = Number((parsedEntryPrice - (expoLong / size)).toFixed(d))
          }
        } else {
          //retorno de posicion vacia 
          return null
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
}
