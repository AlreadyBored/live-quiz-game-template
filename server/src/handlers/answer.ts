import type { WebSocket } from "ws";
import type { AnswerData } from "../types.js";
import { send, sendError } from "../utils/index.js";
import { userIdBySocket, gamesById } from "../store.js";
import { finishCurrentQuestion } from "./finishQuestion.js";

export const handleAnswer = (ws: WebSocket, data: AnswerData): void => {
  const userId = userIdBySocket.get(ws);

  if (!userId) {
    sendError(ws, "Not authenticated");
    return;
  }

  const game = gamesById.get(data.gameId);

  if (!game) {
    sendError(ws, "Game not found");
    return;
  }

  if (game.status !== "in_progress") {
    sendError(ws, "Game is not in progress");
    return;
  }

  if (!game.players.some((p) => p.index === userId)) {
    sendError(ws, "You are not in this game");
    return;
  }

  if (data.questionIndex !== game.currentQuestion) {
    sendError(ws, "Wrong question index");
    return;
  }

  if (data.answerIndex < 0 || data.answerIndex > 3) {
    sendError(ws, "Invalid answer index");
    return;
  }

  if (game.playerAnswers.has(userId)) {
    sendError(ws, "Already answered this question");
    return;
  }

  game.playerAnswers.set(userId, {
    answerIndex: data.answerIndex,
    timestamp: Date.now(),
  });

  send(ws, "answer_accepted", { questionIndex: data.questionIndex });

  const allAnswered = game.players.every((player) =>
    game.playerAnswers.has(player.index),
  );

  if (allAnswered) {
    if (game.questionTimer) {
      clearTimeout(game.questionTimer);
      game.questionTimer = null;
    }
    finishCurrentQuestion(game);
  }
};
