import { WebSocket } from 'ws';
import type { JoinGameData, Player } from '../types.js';
import { wsToUser, games } from '../storage.js';
import { send, broadcast, getGameSockets } from '../helpers.js';

export function handleJoinGame(ws: WebSocket, data: JoinGameData): void {
  const user = wsToUser.get(ws);
  if (!user) {
    send(ws, 'error', { message: 'You must register first' });
    return;
  }

  const game = [...games.values()].find((g) => g.code === data.code);
  if (!game) {
    send(ws, 'error', { message: 'Game not found' });
    return;
  }

  if (game.status !== 'waiting') {
    send(ws, 'error', { message: 'Game already started' });
    return;
  }

  if (game.players.some((p) => p.index === user.index)) {
    send(ws, 'error', { message: 'Already in this game' });
    return;
  }

  const player: Player = {
    name: user.name,
    index: user.index,
    score: 0,
    ws,
  };
  game.players.push(player);

  send(ws, 'game_joined', { gameId: game.id });

  const allSockets = getGameSockets(game, wsToUser);

  broadcast(allSockets, 'player_joined', {
    playerName: user.name,
    playerCount: game.players.length,
  });

  broadcast(
    allSockets,
    'update_players',
    game.players.map((p) => ({ name: p.name, index: p.index, score: p.score })),
  );
}