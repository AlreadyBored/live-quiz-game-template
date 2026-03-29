import type { WebSocket } from 'ws';
import type { CreateGameData, Game, JoinGameData, Player, ServerContext } from '../types.js';
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

/**
 * Присоединение игрока к комнате по коду (только status === 'waiting').
 * Новому игроку — лично game_joined; всем в комнате — player_joined и update_players.
 */
export function handleJoinGame(context: ServerContext, ws: WebSocket, data: JoinGameData): void {
  const userId = getUserIdForSocket(context, ws);
  if (!userId) {
    sendError(ws, 'You must register first');
    return;
  }

  const user = context.usersById.get(userId);
  if (!user) {
    sendError(ws, 'User not found');
    return;
  }

  const rawCode = typeof data?.code === 'string' ? data.code.trim() : '';
  const code = rawCode.toUpperCase();
  if (code.length !== 6) {
    sendError(ws, 'Invalid room code');
    return;
  }

  const game = context.gamesByCode.get(code);
  if (!game) {
    sendError(ws, 'Game not found');
    return;
  }

  if (game.status !== 'waiting') {
    sendError(ws, 'Game already started');
    return;
  }

  const boundGameId = context.userIdToGameId.get(userId);
  if (boundGameId && boundGameId !== game.id) {
    sendError(ws, 'You are already in another game');
    return;
  }

  const existingPlayer = game.players.find((p) => p.index === userId);
  if (existingPlayer) {
    existingPlayer.ws = ws;
    context.userIdToGameId.set(userId, game.id);
    sendMessage(ws, 'game_joined', { gameId: game.id });
    broadcastToGame(game, 'update_players', toPublicPlayers(game.players));
    return;
  }

  const player: Player = {
    name: user.name,
    index: user.index,
    score: 0,
    ws,
  };
  game.players.push(player);
  context.userIdToGameId.set(userId, game.id);

  sendMessage(ws, 'game_joined', { gameId: game.id });
  broadcastToGame(game, 'player_joined', {
    playerName: user.name,
    playerCount: game.players.length,
  });
  broadcastToGame(game, 'update_players', toPublicPlayers(game.players));
}
