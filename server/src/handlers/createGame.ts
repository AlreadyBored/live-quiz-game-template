import type { WebSocket } from "ws";
import type { CreateGameData, Game } from "../types.js";
import { send, sendError } from "../utils/index.js";
import {
  userIdBySocket,
  gamesById,
  gameByCode,
  generateGameId,
  generateGameCode,
} from "../store.js";

export const handleCreateGame = (ws: WebSocket, data: CreateGameData): void => {
  const hostId = userIdBySocket.get(ws);

  if (!hostId) {
    sendError(ws, "Not authenticated");
    return;
  }

  if (data.questions.length === 0) {
    sendError(ws, "At least one question is required");
    return;
  }

  for (const q of data.questions) {
    if (q.options.length !== 4) {
      sendError(ws, "Each question must have exactly 4 options");
      return;
    }
    if (q.correctIndex < 0 || q.correctIndex > 3) {
      sendError(ws, "correctIndex must be 0-3");
      return;
    }
    if (q.timeLimitSec <= 0) {
      sendError(ws, "timeLimitSec must be positive");
      return;
    }
  }

  const gameId = generateGameId();
  const code = generateGameCode();

  const game: Game = {
    id: gameId,
    code,
    hostId,
    questions: data.questions,
    players: [],
    currentQuestion: -1,
    status: "waiting",
    questionTimer: null,
    questionStartTime: null,
    playerAnswers: new Map(),
  };

  gamesById.set(gameId, game);
  gameByCode.set(code, game);

  send(ws, "game_created", { gameId, code });
};
