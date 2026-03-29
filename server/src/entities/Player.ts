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
  }

  resetAnswerData() {
    this.hasAnswered = undefined
    this.answerTime = undefined
    this.answeredCorrectly = undefined
  }

  updatePlayerAnswerStats(answerTime: number, answeredCorrectly: boolean) {
    this.hasAnswered = true
    this.answerTime = answerTime
    this.answeredCorrectly = answeredCorrectly
  }

  updatePlayerScore(questionStartTime: number, timeLimitSec: number) {
    if (!this.answeredCorrectly || !this.answerTime) {
      return this.score
    }

    const timeBonusModifier =
      (timeLimitSec * 1000) / (this.answerTime - questionStartTime)
    this.score += Math.floor(timeBonusModifier * 100)
    return this.score
  }
}
