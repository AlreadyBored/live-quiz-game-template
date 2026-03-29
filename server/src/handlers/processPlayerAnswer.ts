import { WebSocket } from "ws"
import gameService from "../services/GameService"
import playerService from "../services/PlayerService"
import { WSMessage } from "../types"

export function processPlayerAnswer(ws: WebSocket, message: WSMessage) {
  const {
    data: { gameId, questionIndex, answerIndex },
  } = message

  const player = playerService.getPlayer(ws)
  const game = gameService.findGameById(gameId)
  game.processPlayerAnswer(player, questionIndex, answerIndex)

  return {
    type: "answer_accepted",
    data: {
      questionIndex,
    },
    id: 0,
  }
}
