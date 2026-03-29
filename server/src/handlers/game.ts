import type { WebSocket } from 'ws';
import type { CreateGameData, Game, Player, ServerContext } from '../types.js';
import {
  broadcastToGame,
  generateId,
  generateRoomCode,
  isQuestionValid,
  sendError,
  sendMessage,
  toPublicPlayers,
} from '../utils.js';

function getUserIdForSocket(context: ServerContext, ws: WebSocket): string | undefined {
  return context.wsToUserId.get(ws);
}

export function handleCreateGame(context: ServerContext, ws: WebSocket, data: CreateGameData): void {
  const userId = getUserIdForSocket(context, ws);
  if (!userId) {
    sendError(ws, 'You must register first');
    return;
  }

  if (context.userIdToGameId.has(userId)) {
    sendError(ws, 'You are already in a game');
    return;
  }

  const user = context.usersById.get(userId);
  if (!user) {
    sendError(ws, 'User not found');
    return;
  }

  const questions = data?.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    sendError(ws, 'Questions must be a non-empty array');
    return;
  }

  if (!questions.every(isQuestionValid)) {
    sendError(ws, 'Invalid questions payload');
    return;
  }

  const hostPlayer: Player = {
    name: user.name,
    index: user.index,
    score: 0,
    ws,
  };

  const game: Game = {
    id: generateId(),
    code: generateRoomCode(new Set(context.gamesByCode.keys())),
    hostId: user.index,
    questions,
    players: [hostPlayer],
    currentQuestion: -1,
    status: 'waiting',
    playerAnswers: new Map(),
  };

  context.gamesById.set(game.id, game);
  context.gamesByCode.set(game.code, game);
  context.userIdToGameId.set(userId, game.id);

  sendMessage(ws, 'game_created', {
    gameId: game.id,
    code: game.code,
  });

  broadcastToGame(game, 'update_players', toPublicPlayers(game.players));
}
