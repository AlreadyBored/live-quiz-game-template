import type { WebSocket } from "ws"
import { Player as PlayerInterface } from "../types"

export class Player implements PlayerInterface {
  name: string
  index: string
  score: number
  ws?: WebSocket
  hasAnswered?: boolean
  answerTime?: number
  answeredCorrectly?: boolean

  constructor(ws: WebSocket, name: string, index: string) {
    this.name = name
    this.index = index
    this.score = 0
    this.ws = ws
    this.hasAnswered = undefined
    this.answerTime = undefined
    this.answeredCorrectly = undefined
  }
}
