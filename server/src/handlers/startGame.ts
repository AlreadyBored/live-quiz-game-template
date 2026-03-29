import type { WebSocket } from "ws";
import type { StartGameData } from "../types.js";
import { sendError } from "../utils/index.js";
import { userIdBySocket, gamesById } from "../store.js";
import { startQuestion } from "./startQuestion.js";

export const handleStartGame = (ws: WebSocket, data: StartGameData): void => {
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

  if (game.hostId !== userId) {
    sendError(ws, "Only the host can start the game");
    return;
  }

  if (game.status !== "waiting") {
    sendError(ws, "Game already started");
    return;
  }

  if (game.questions.length === 0) {
    sendError(ws, "No questions in the game");
    return;
  }

  game.status = "in_progress";
  game.currentQuestion = 0;

  startQuestion(game);
};
