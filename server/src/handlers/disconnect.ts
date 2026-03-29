import type { WebSocket } from "ws";
import type { Game } from "../types.js";
import { userIdBySocket, socketsByUserId, gamesById } from "../store.js";
import { broadcastToGame } from "../utils/index.js";
import { finishCurrentQuestion } from "./finishQuestion.js";

export const disconnectUser = (ws: WebSocket): string | null => {
  const userId = userIdBySocket.get(ws);

  if (!userId) {
    return null;
  }

  userIdBySocket.delete(ws);
  socketsByUserId.delete(userId);

  return userId;
};

export const removePlayerFromGame = (userId: string): void => {
  const game = Array.from(gamesById.values()).find((g) =>
    g.players.some((p) => p.index === userId),
  );

  if (!game) return;

  game.players = game.players.filter((p) => p.index !== userId);

  broadcastPlayers(game);
  maybeFinishQuestionAfterDisconnect(game);
};

const broadcastPlayers = (game: Game): void => {
  broadcastToGame(
    game,
    "update_players",
    game.players.map(({ name, index, score }) => ({
      name,
      index,
      score,
    })),
  );
};

const maybeFinishQuestionAfterDisconnect = (game: Game): void => {
  const shouldFinishQuestion =
    game.status === "in_progress" &&
    game.players.length > 0 &&
    game.players.every((player) => game.playerAnswers.has(player.index));

  if (!shouldFinishQuestion) {
    return;
  }

  if (game.questionTimer) {
    clearTimeout(game.questionTimer);
    game.questionTimer = null;
  }

  finishCurrentQuestion(game);
};
