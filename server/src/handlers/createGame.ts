import { WebSocket } from "ws"
import gameService from "../services/GameService"
import playerService from "../services/PlayerService"
import { WSMessage } from "../types"

export function createGame(ws: WebSocket, message: WSMessage) {
  const {
    id,
    data: { questions },
  } = message

  const game = gameService.generateGame(`${id}`, questions)
  gameService.registerGame(game)

  const player = playerService.getPlayer(ws)
  game.addPlayerToGame(player)

  return {
    type: "game_created",
    data: {
      gameId: game.id,
      code: game.code,
    },
    id: 0,
  }
}
