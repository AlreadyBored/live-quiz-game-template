import gameService from "../services/GameService"
import { WSMessage } from "../types"

export function createGame(message: WSMessage) {
  const {
    id,
    data: { questions },
  } = message

  const game = gameService.generateGame(`${id}`, questions)
  gameService.registerGame(game)

  return {
    type: "game_created",
    data: {
      gameId: game.id,
      code: game.code,
    },
    id: 0,
  }
}
