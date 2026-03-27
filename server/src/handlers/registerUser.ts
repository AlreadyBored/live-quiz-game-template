import { WebSocket } from "ws"
import playerService from "../services/PlayerService"
import { WSMessage } from "../types"

export function registerUser(ws: WebSocket, message: WSMessage) {
  const { name } = message.data

  const player = playerService.generatePlayer(ws, name)
  playerService.registerPlayer(player)

  return {
    type: "reg",
    data: {
      name: name,
      index: player.index,
      error: false,
      errorText: "",
    },
    id: 0,
  }
}
