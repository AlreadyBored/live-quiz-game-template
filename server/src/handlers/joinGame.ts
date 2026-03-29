import type { WebSocket } from "ws";
import type { JoinGameData } from "../types.js";
import { send, sendError, broadcastToGame } from "../utils/index.js";
import { userIdBySocket, usersById, gameByCode } from "../store.js";

export const handleJoinGame = (ws: WebSocket, data: JoinGameData): void => {
  const userId = userIdBySocket.get(ws);

  if (!userId) {
    sendError(ws, "Not authenticated");
    return;
  }

  const game = gameByCode.get(data.code);

  if (!game) {
    sendError(ws, "Game not found");
    return;
  }

  if (game.status !== "waiting") {
    sendError(ws, "Game already started");
    return;
  }

  if (game.hostId === userId) {
    sendError(ws, "Host cannot join the game as a player");
    return;
  }

  if (game.players.some((p) => p.index === userId)) {
    sendError(ws, "Already joined this game");
    return;
  }

  const user = usersById.get(userId)!;

  game.players.push({
    name: user.name,
    index: userId,
    score: 0,
  });

  send(ws, "game_joined", { gameId: game.id });

  broadcastToGame(game, "player_joined", {
    playerName: user.name,
    playerCount: game.players.length,
  });

  broadcastToGame(
    game,
    "update_players",
    game.players.map(({ name, index, score }) => ({ name, index, score })),
  );
};
