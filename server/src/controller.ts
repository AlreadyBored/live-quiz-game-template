import { WebSocket } from "ws"
import { registerUser, createGame, joinPlayerToGame, startGame } from "./handlers/index"
import { WSMessage } from "./types"

export function processMessage(ws: WebSocket, message: WSMessage) {
  const { type } = message

  switch (type) {
    case "reg":
      return registerUser(ws, message)
    case "create_game":
      return createGame(ws, message)
    case "join_game":
      return joinPlayerToGame(ws, message)
    case "start_game":
      return startGame(ws, message)
    default:
      break
  }
}
