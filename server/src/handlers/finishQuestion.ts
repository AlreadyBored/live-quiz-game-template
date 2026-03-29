import type { Game, PlayerResult, ScoreboardEntry } from "../types.js";
import { broadcastToGame } from "../utils/index.js";
import { startQuestion } from "./startQuestion.js";

const BASE_POINTS = 1000;

export const finishCurrentQuestion = (game: Game): void => {
  const questionIndex = game.currentQuestion;
  const question = game.questions[questionIndex];

  const playerResults: PlayerResult[] = game.players.map((player) => {
    const answer = game.playerAnswers.get(player.index);

    if (!answer) {
      return {
        name: player.name,
        answered: false,
        correct: false,
        pointsEarned: 0,
        totalScore: player.score,
      };
    }

    const isCorrect = answer.answerIndex === question.correctIndex;

    let pointsEarned = 0;

    if (isCorrect && game.questionStartTime) {
      const timeElapsed = (answer.timestamp - game.questionStartTime) / 1000;
      const timeRemaining = Math.max(0, question.timeLimitSec - timeElapsed);
      pointsEarned = Math.round(
        BASE_POINTS * (timeRemaining / question.timeLimitSec),
      );
    }

    player.score += pointsEarned;

    return {
      name: player.name,
      answered: true,
      correct: isCorrect,
      pointsEarned,
      totalScore: player.score,
    };
  });

  broadcastToGame(game, "question_result", {
    questionIndex,
    correctIndex: question.correctIndex,
    playerResults,
  });

  const nextQuestionIndex = questionIndex + 1;

  if (nextQuestionIndex < game.questions.length) {
    game.questionTimer = setTimeout(() => {
      game.currentQuestion = nextQuestionIndex;
      startQuestion(game);
    }, 3000);
  } else {
    setTimeout(() => {
      finishGame(game);
    }, 3000);
  }
};

const finishGame = (game: Game): void => {
  game.status = "finished";

  const sorted = [...game.players].sort((a, b) => b.score - a.score);

  const scoreboard: ScoreboardEntry[] = sorted.map((player, i) => ({
    name: player.name,
    score: player.score,
    rank: i + 1,
  }));

  broadcastToGame(game, "game_finished", { scoreboard });
};
