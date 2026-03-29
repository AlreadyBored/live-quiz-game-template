import type { Game } from "../types.js";
import { broadcastToGame } from "../utils/index.js";
import { finishCurrentQuestion } from "./finishQuestion.js";

export const startQuestion = (game: Game): void => {
  const question = game.questions[game.currentQuestion];

  game.questionStartTime = Date.now();
  game.playerAnswers = new Map();

  broadcastToGame(game, "question", {
    questionNumber: game.currentQuestion + 1,
    totalQuestions: game.questions.length,
    text: question.text,
    options: question.options,
    timeLimitSec: question.timeLimitSec,
  });

  game.questionTimer = setTimeout(() => {
    finishCurrentQuestion(game);
  }, question.timeLimitSec * 1000);
};
