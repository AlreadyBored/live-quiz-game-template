import { WebSocket } from "ws"
import { registerUser, createGame } from "./handlers/index"
import { WSMessage } from "./types"

export function processMessage(ws: WebSocket, message: WSMessage) {
  const { type } = message

  switch (type) {
    case "reg":
      return registerUser(ws, message)
    case "create_game":
      return createGame(message)
    default:
      break
  }
}
