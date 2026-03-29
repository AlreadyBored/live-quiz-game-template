import { WebSocket } from "ws"
import gameService from "../services/GameService"
import playerService from "../services/PlayerService"
import { WSMessage } from "../types"

export function joinPlayerToGame(ws: WebSocket, message: WSMessage) {
  const { code } = message.data

  const game = gameService.findGameByCode(String(code).toLowerCase())
  const player = playerService.getPlayer(ws)
  game.addPlayerToGame(player)

  return {
    type: "game_joined",
    data: {
      gameId: game.id,
    },
    id: 0,
  }
}
