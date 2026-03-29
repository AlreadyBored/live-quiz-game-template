import crypto from "crypto"
import { Game } from "../entities/Game"
import { CodeGenerator } from "./CodeGenerator"
import { Question } from "../types"

class GameService {
  gamesByCode: { [key: string]: Game }
  gamesById: { [key: string]: Game }

  constructor() {
    this.gamesByCode = {}
    this.gamesById = {}
  }

  generateGame(id: string, questions: Question[]) {
    const gameId = CodeGenerator.generateGameId()
    const gameCode = CodeGenerator.generateGameCode()
    return new Game(gameId, gameCode, id, questions)
  }

  registerGame(game: Game) {
    this.gamesByCode[game.code] = game
    this.gamesById[game.id] = game
  }

  findGameByCode(code: string) {
    const game = this.gamesByCode[code]

    if (!game) {
      throw new Error("Game not found")
    }

    return game
  }

  findGameById(id: string) {
    const game = this.gamesById[id]

    if (!game) {
      throw new Error("Game not found")
    }

    return game
  }
}

const gameService = new GameService()

export default gameService
