import { Player } from "./Player"
import { Game as GameInterface, Question } from "../types"

export class Game implements GameInterface {
  id: string
  code: string
  hostId: string
  questions: Question[]
  players: Player[]
  currentQuestion: number
  status: "waiting" | "in_progress" | "finished"
  questionStartTime?: number | undefined
  questionTimer?: NodeJS.Timeout | undefined
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

  broadcastToPlayers(data: { [key: string]: any }) {
    for (const player of this.players) {
      if (!player.ws) {
        continue
      }
      player.ws?.send(JSON.stringify(data))
    }
  }

  broadcastPlayerJoined(newPlayer: Player) {
    this.broadcastToPlayers({
      type: "player_joined",
      data: {
        playerName: newPlayer.name,
        playerCount: this.players.length,
      },
      id: 0,
    })
  }

  broadcastUpdatePlayers() {
    this.broadcastToPlayers({
      type: "update_players",
      data: this.players.map(({ index, name, score }) => ({
        index,
        name,
        score,
      })),
      id: 0,
    })
  }

  addPlayerToGame(player: Player) {
    this.players.push(player)
    this.broadcastPlayerJoined(player)
    this.broadcastUpdatePlayers()
  }

  setPlayersAnswerData() {
    for (const player of this.players) {
      player.resetAnswerData()
    }
  }

  broadcastQuestionResults() {
    const { correctIndex, timeLimitSec } = this.questions[this.currentQuestion]

    this.broadcastToPlayers({
      type: "question_result",
      data: {
        questionIndex: this.currentQuestion,
        correctIndex,
        playerResults: this.players.map((player) => {
          const { name, hasAnswered, answeredCorrectly, score } = player

          const updatedScore = player.updatePlayerScore(
            this.questionStartTime!,
            timeLimitSec
          )

          return {
            name,
            answered: hasAnswered,
            correct: answeredCorrectly,
            pointsEarned: updatedScore - score,
            totalScore: updatedScore,
          }
        }),
      },
      id: 0,
    })
  }

  getCurrentQuestion() {
    this.currentQuestion += 1
    if (this.currentQuestion === this.questions.length) {
      return false
    }
    return this.questions[this.currentQuestion]
  }

  clearQuestionTimer() {
    if (this.questionTimer) {
      clearTimeout(this.questionTimer)
    }
  }

  setCurrentQuestionTimers(timeLimitSec: number) {
    this.clearQuestionTimer()
    this.questionTimer = setTimeout(
      () => this.broadcastQuestionResults(),
      timeLimitSec * 1000
    )
    this.questionStartTime = Date.now()
  }

  finishGame() {
    this.status = "finished"
    const playerScores = this.players
      .map(({ score }) => score)
      .sort((a, b) => b - a)

    this.broadcastToPlayers({
      type: "game_finished",
      data: {
        scoreboard: this.players.map(({ name, score }) => {
          return {
            name,
            score,
            rank: playerScores.indexOf(score) + 1,
          }
        }),
      },
      id: 0,
    })
  }

  broadcastNextQuestion() {
    const question = this.getCurrentQuestion()

    if (question === false) {
      this.finishGame()
      return
    }

    this.setPlayersAnswerData()
    this.setCurrentQuestionTimers(question.timeLimitSec)

    this.broadcastToPlayers({
      type: "question",
      data: {
        questionNumber: this.currentQuestion + 1,
        totalQuestions: this.questions.length,
        text: question.text,
        options: question.options,
        timeLimitSec: question.timeLimitSec,
      },
      id: 0,
    })
  }

  startGame() {
    this.status = "in_progress"
    this.broadcastNextQuestion()
  }

  allPlayersAnswered() {
    const [, ...players] = this.players
    return players.every(({ hasAnswered }) => hasAnswered === true)
  }

  processPlayerAnswer(
    player: Player,
    questionIndex: number,
    answerIndex: number
  ) {
    const playerAnswerTime = Date.now()
    const { correctIndex } = this.questions[questionIndex]

    player.updatePlayerAnswerStats(
      playerAnswerTime,
      answerIndex === correctIndex
    )

    if (this.allPlayersAnswered()) {
      this.clearQuestionTimer()
      this.broadcastQuestionResults()
      this.broadcastNextQuestion()
    }
  }
}
