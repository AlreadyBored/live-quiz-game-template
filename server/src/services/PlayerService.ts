import type { WebSocket } from "ws"
import { Player } from "../entities/Player"
import { CodeGenerator } from "./CodeGenerator"

class PlayerService {
  players: Map<WebSocket, Player>

  constructor() {
    this.players = new Map()
  }

  generatePlayer(ws: WebSocket, name: string) {
    const playerIndex = CodeGenerator.generatePlayerIndex()
    return new Player(ws, name, playerIndex)
  }

  registerPlayer(player: Player) {
    this.players.set(player.ws, player)
  }
}

const playerService = new PlayerService()

export default playerService
