import { WebSocket } from 'ws';
import type { RegData, User } from '../types.js';
import { users, wsToUser, nextUserId } from '../storage.js';

function send(ws: WebSocket, type: string, data: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data, id: 0 }));
  }
}

export function handleReg(ws: WebSocket, data: RegData): void {
  const { name, password } = data;

  if (!name || !password) {
    send(ws, 'reg', { name: name || '', index: '', error: true, errorText: 'Name and password are required' });
    return;
  }

  const existing = users.get(name);

  if (existing) {
    if (existing.password !== password) {
      send(ws, 'reg', { name, index: '', error: true, errorText: 'Incorrect password' });
      return;
    }
    existing.ws = ws;
    wsToUser.set(ws, existing);
    send(ws, 'reg', { name, index: existing.index, error: false, errorText: '' });
  } else {
    const index = nextUserId();
    const user: User = { name, password, index, ws };
    users.set(name, user);
    wsToUser.set(ws, user);
    send(ws, 'reg', { name, index, error: false, errorText: '' });
  }
}