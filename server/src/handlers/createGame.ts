import type { WebSocket } from "ws";
import type { CreateGameData, Game, Question } from "../types.js";
import { send } from "../utils/index.js";
import {
  userIdBySocket,
  gamesById,
  gameByCode,
  generateGameId,
  generateGameCode,
} from "../store.js";

export const handleCreateGame = (ws: WebSocket, data: CreateGameData): void => {
  const hostId = userIdBySocket.get(ws)!;
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
    playerAnswers: new Map(),
  };

  gamesById.set(gameId, game);
  gameByCode.set(code, game);

  send(ws, "game_created", { gameId, code });
};
