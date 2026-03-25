import { WebSocket } from 'ws';
import { USERS, WS_TO_USER } from '../store/store';
import { randomUUID } from 'node:crypto';

const createNewUser = (ws: WebSocket, data: any) => {
  const { name, password } = data;

  const newUser = {
    name,
    password,
    index: randomUUID(),
    ws,
  };

  USERS.set(name, newUser);

  return newUser;
};

export const regHandler = (ws: WebSocket, data: any) => {
  const { name, password } = data;

  const user = USERS.get(name) || createNewUser(ws, data);

  WS_TO_USER.set(ws, user.name);

  ws.send(
    JSON.stringify({
      type: 'reg',
      data: {
        name: user.name,
        index: user.index,
        error: false,
        errorText: '',
      },
      id: 0,
    }),
  );
};
