import { WebSocket } from "ws"
import gameService from "../services/GameService"
import playerService from "../services/PlayerService"
import { WSMessage } from "../types"

export function joinPlayerToGame(ws: WebSocket, message: WSMessage) {
  const { code } = message.data
  const game = gameService.findGame(String(code).toLowerCase())

  if (game === undefined) {
    throw new Error("Game not found")
  }

  const player = playerService.getPlayer(ws)

  if (player === undefined) {
    throw new Error("Player not found")
  }

  game.addPlayerToGame(player)
  const players = game.players

  for (const gamePlayer of players) {
    gamePlayer.ws?.send(
      JSON.stringify({
        type: "player_joined",
        data: {
          playerName: player.name,
          playerCount: players.length,
        },
        id: 0,
      })
    )
  }

  return {
    type: "game_joined",
    data: {
      gameId: game.id,
    },
    id: 0,
  }
}
