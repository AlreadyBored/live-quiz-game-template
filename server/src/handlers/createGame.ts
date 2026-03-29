import { WebSocket } from 'ws';
import type { CreateGameData, Game } from '../types.js';
import { wsToUser, games, nextGameId } from '../storage.js';
import { send, generateCode } from '../helpers.js';

export function handleCreateGame(ws: WebSocket, data: CreateGameData): void {
  const user = wsToUser.get(ws);
  if (!user) {
    send(ws, 'error', { message: 'You must register first' });
    return;
  }

  const { questions } = data;
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    send(ws, 'error', { message: 'Questions are required' });
    return;
  }

  const id = nextGameId();
  const code = generateCode();

  const game: Game = {
    id,
    code,
    hostId: user.index,
    questions,
    players: [],
    currentQuestion: -1,
    status: 'waiting',
    playerAnswers: new Map(),
  };

  games.set(id, game);
  send(ws, 'game_created', { gameId: id, code });
}