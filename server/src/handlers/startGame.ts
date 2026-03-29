import { WebSocket } from 'ws';
import type { StartGameData, Game } from '../types.js';
import { wsToUser, games } from '../storage.js';
import { send, broadcast, getGameSockets } from '../helpers.js';
import { endQuestion } from './answer.js';

export function handleStartGame(ws: WebSocket, data: StartGameData): void {
  const user = wsToUser.get(ws);
  if (!user) {
    send(ws, 'error', { message: 'You must register first' });
    return;
  }

  const game = games.get(data.gameId);
  if (!game) {
    send(ws, 'error', { message: 'Game not found' });
    return;
  }

  if (game.hostId !== user.index) {
    send(ws, 'error', { message: 'Only the host can start the game' });
    return;
  }

  if (game.status !== 'waiting') {
    send(ws, 'error', { message: 'Game already started' });
    return;
  }

  game.status = 'in_progress';
  game.currentQuestion = 0;
  sendQuestion(game);
}

export function sendQuestion(game: Game): void {
  const q = game.questions[game.currentQuestion];
  game.playerAnswers = new Map();
  game.questionStartTime = Date.now();

  for (const p of game.players) {
    p.hasAnswered = false;
    p.answeredCorrectly = false;
    p.answerTime = undefined;
  }

  const allSockets = getGameSockets(game, wsToUser);

  broadcast(allSockets, 'question', {
    questionNumber: game.currentQuestion + 1,
    totalQuestions: game.questions.length,
    text: q.text,
    options: q.options,
    timeLimitSec: q.timeLimitSec,
  });

  game.questionTimer = setTimeout(() => {
    endQuestion(game);
  }, q.timeLimitSec * 1000);
}