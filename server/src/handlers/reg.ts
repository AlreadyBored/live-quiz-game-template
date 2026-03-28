import type { WebSocket } from 'ws';
import type { RegData, ServerContext, User } from '../types.js';
import { generateId, sendMessage } from '../utils.js';

export function handleReg(context: ServerContext, ws: WebSocket, data: RegData): void {
  const name = typeof data?.name === 'string' ? data.name.trim() : '';
  const password = typeof data?.password === 'string' ? data.password.trim() : '';

  if (!name || !password) {
    sendMessage(ws, 'reg', {
      name: name || '',
      index: '',
      error: true,
      errorText: 'Name and password are required',
    });
    return;
  }

  const existingUser = context.usersByName.get(name);

  if (existingUser) {
    if (existingUser.password !== password) {
      sendMessage(ws, 'reg', {
        name,
        index: '',
        error: true,
        errorText: 'Wrong password',
      });
      return;
    }

    existingUser.ws = ws;
    context.wsToUserId.set(ws, existingUser.index);

    sendMessage(ws, 'reg', {
      name: existingUser.name,
      index: existingUser.index,
      error: false,
      errorText: '',
    });
    return;
  }

  const user: User = {
    name,
    password,
    index: generateId(),
    ws,
  };

  context.usersByName.set(user.name, user);
  context.usersById.set(user.index, user);
  context.wsToUserId.set(ws, user.index);

  sendMessage(ws, 'reg', {
    name: user.name,
    index: user.index,
    error: false,
    errorText: '',
  });
}
