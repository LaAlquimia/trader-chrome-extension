import bybitPositions from './positions.js'
import * as consts from './consts/consts.js'
import handlePosition from './message.js'

const position = await bybitPositions(consts.apikey, consts.apisecret, 'LOOM')
  .then(positions => {
    console.log(handlePosition(positions, 1, 1))
  })
  .catch(error => {
    console.log(error)
  })


