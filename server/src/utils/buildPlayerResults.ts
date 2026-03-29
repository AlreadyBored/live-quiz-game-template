import { Game } from "../types";
import { BASE_POINTS } from "./messageHandler";



export function buildPlayerResults(game: Game, timeLimit: number) {
  return game.players.map((p) => {
    const answer = game.playerAnswers.get(p.index);
    const pointsEarned =
      answer && p.answeredCorrectly
        ? Math.round(BASE_POINTS * (1 - answer.timestamp / timeLimit))
        : 0;
    return {
      name: p.name,
      answered: !!answer,
      correct: !!p.answeredCorrectly,
      pointsEarned,
      totalScore: p.score,
    };
  });
}
