import { WebSocket } from 'ws';
import { wsToUser, games } from '../storage.js';
import { broadcast, getGameSockets } from '../helpers.js';
import { endQuestion } from './answer.js';

export function handleDisconnect(ws: WebSocket): void {
  const user = wsToUser.get(ws);
  if (!user) {
    wsToUser.delete(ws);
    return;
  }

  for (const game of games.values()) {
    if (game.status === 'finished') continue;

    const playerIndex = game.players.findIndex((p) => p.index === user.index);
    if (playerIndex === -1) continue;

    game.players.splice(playerIndex, 1);

    const allSockets = getGameSockets(game, wsToUser);
    broadcast(
      allSockets,
      'update_players',
      game.players.map((p) => ({ name: p.name, index: p.index, score: p.score })),
    );

    if (game.status === 'in_progress' && game.players.length > 0 && game.players.every((p) => p.hasAnswered)) {
      clearTimeout(game.questionTimer);
      endQuestion(game);
    }
  }

  user.ws = undefined;
  wsToUser.delete(ws);
}