import { WebSocket } from 'ws';
import { games } from './storage.js';

export function send(ws: WebSocket, type: string, data: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data, id: 0 }));
  }
}

export function broadcast(recipients: WebSocket[], type: string, data: unknown): void {
  for (const ws of recipients) {
    send(ws, type, data);
  }
}

export function getGameSockets(game: import('./types.js').Game, wsToUser: Map<WebSocket, import('./types.js').User>): WebSocket[] {
  const sockets: WebSocket[] = [];
  for (const [ws, user] of wsToUser) {
    if (user.index === game.hostId || game.players.some((p) => p.index === user.index)) {
      sockets.push(ws);
    }
  }
  return sockets;
}

export function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while ([...games.values()].some((g) => g.code === code));
  return code;
}