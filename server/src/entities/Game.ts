import { Game as GameInterface, Question, Player } from "../types"

export class Game implements GameInterface {
  id: string
  code: string
  hostId: string
  questions: Question[]
  players: Player[]
  currentQuestion: number
  status: "waiting" | "in_progress" | "finished"
  playerAnswers: Map<string, { answerIndex: number; timestamp: number }>

  constructor(id: string, code: string, hostId: string, questions: Question[]) {
    this.id = id
    this.code = code
    this.hostId = hostId
    this.questions = questions
    this.players = []
    this.currentQuestion = -1
    this.status = "waiting"
    this.playerAnswers = new Map()
  }

  addPlayerToGame(player: Player) {
    this.players.push(player)
  }
}
