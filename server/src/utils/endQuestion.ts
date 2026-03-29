import { Game, WSMessage } from "../types";
import { broadcast } from "./broadcast";
import { buildPlayerResults } from "./buildPlayerResults";
import { sendNextQuestion } from "./sendNextQuestion";

export function endQuestion(game: Game, questionIndex: number) {
  const question = game.questions[questionIndex];
  const timeLimit = question.timeLimitSec * 1000;

  const resultResponse: WSMessage = {
    type: "question_result",
    data: {
      questionIndex,
      correctIndex: question.correctIndex,
      playerResults: buildPlayerResults(game, timeLimit),
    },
    id: 0,
  };
  game.hostWs.send(JSON.stringify(resultResponse));
  broadcast(game, resultResponse);

  game.playerAnswers.clear();
  game.players.forEach((p) => {
    p.hasAnswered = false;
    p.answeredCorrectly = false;
  });

  sendNextQuestion(game);
}
