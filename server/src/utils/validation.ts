import type { WebSocket } from 'ws';
import type { User, Game, CreateGameData } from '../types';

export const getUserByWebSocket = (
  wsToUserId: Map<WebSocket, string>,
  users: Map<string, User>,
  ws: WebSocket
): User | null => {
  const userId = wsToUserId.get(ws);
  if (!userId) return null;
  return users.get(userId) || null;
};

export const validateUserLoggedIn = (
  wsToUserId: Map<WebSocket, string>,
  users: Map<string, User>,
  ws: WebSocket
): { valid: boolean; user?: User; error?: string } => {
  const user = getUserByWebSocket(wsToUserId, users, ws);
  if (!user) {
    return { valid: false, error: 'User not logged in' };
  }
  return { valid: true, user };
};

export const validateGameExists = (
  games: Map<string, Game>,
  gameId: string
): { valid: boolean; game?: Game; error?: string } => {
  const game = games.get(gameId);
  if (!game) {
    return { valid: false, error: 'Game not found' };
  }
  return { valid: true, game };
};

export const validateGameCode = (
  gameCodes: Map<string, string>,
  games: Map<string, Game>,
  code: string
): { valid: boolean; game?: Game; error?: string } => {
  const gameId = gameCodes.get(code);
  if (!gameId) {
    return { valid: false, error: 'Invalid room code' };
  }
  return validateGameExists(games, gameId);
};

export const validateCreateGameData = (
  data: any
): { valid: boolean; gameData?: CreateGameData; error?: string } => {
  if (!data || !Array.isArray(data.questions)) {
    return { valid: false, error: 'Invalid game data: questions array required' };
  }
  if (data.questions.length === 0) {
    return { valid: false, error: 'At least one question is required' };
  }
  return { valid: true, gameData: data as CreateGameData };
};

export const isPlayerInGame = (
  games: Map<string, Game>,
  userId: string
): Game | null => {
  for (const game of games.values()) {
    if (game.players.some(player => player.index === userId)) {
      return game;
    }
  }
  return null;
};
