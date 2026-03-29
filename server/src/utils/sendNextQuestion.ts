import { Game, WSMessage } from "../types";
import { broadcast } from "./broadcast";
import { endQuestion } from "./endQuestion";

export function sendNextQuestion(game: Game) {
  game.currentQuestion++;
  const questionNumber = game.currentQuestion;

  if (questionNumber >= game.questions.length) {
    game.status = "finished";
    const scoreboard = game.players
      .map((p) => ({ name: p.name, score: p.score, rank: 0 }))
      .sort((a, b) => b.score - a.score)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));
    const finishedResponse: WSMessage = {
      type: "game_finished",
      data: { scoreboard },
      id: 0,
    };
    game.hostWs.send(JSON.stringify(finishedResponse));
    broadcast(game, finishedResponse);
    return;
  }

  const question = game.questions[questionNumber];
  const timeLimit = question.timeLimitSec * 1000;

  const questionResponse: WSMessage = {
    type: "question",
    data: {
      questionNumber,
      totalQuestions: game.questions.length,
      text: question.text,
      options: question.options,
      timeLimitSec: question.timeLimitSec,
    },
    id: 0,
  };

  game.questionStartTime = Date.now();
  game.status = "in_progress";
  game.hostWs.send(JSON.stringify(questionResponse));
  broadcast(game, questionResponse);

  game.questionTimer = setTimeout(() => {
    endQuestion(game, questionNumber);
  }, timeLimit);
}
