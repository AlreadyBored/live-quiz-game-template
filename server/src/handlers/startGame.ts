import { WebSocket } from "ws"
import gameService from "../services/GameService"
import { WSMessage } from "../types"

export function startGame(ws: WebSocket, message: WSMessage) {
  const {
    data: { gameId },
  } = message
  const game = gameService.findGameById(gameId)
  game.startGame()

  return {
    type: "start_game",
    data: {
      gameId,
    },
    id: 0,
  }
}
