import { WebSocketServer, WebSocket } from 'ws';
import type { User, Game, RegData } from './types';
import { generateUserId } from './utils/generators';
import { sendMessage, parseMessage } from './utils/message';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const users = new Map<string, User>();
const games = new Map<string, Game>();
const gameCodes = new Map<string, string>();
const wsToUserId = new Map<WebSocket, string>();

const wss = new WebSocketServer({ port: PORT });

const findUserByName = (name: string): User | undefined => {
  return Array.from(users.values()).find(user => user.name === name);
};

const handleRegistration = (ws: WebSocket, data: any): void => {
  const { name, password } = data as RegData;

  if (!name || !password) {
    sendMessage(ws, 'reg', { error: true, errorText: 'Name and password required' });
    return;
  }

  const existingUser = findUserByName(name);

  if (existingUser) {
    if (existingUser.password !== password) {
      sendMessage(ws, 'reg', { error: true, errorText: 'Invalid password' });
      return;
    }

    existingUser.ws = ws;
    wsToUserId.set(ws, existingUser.index);
    sendMessage(ws, 'reg', { name: existingUser.name, index: existingUser.index, error: false });
    console.log(`User logged in: ${name}`);
    return;
  }

  const userId = generateUserId();
  const newUser: User = { name, password, index: userId, ws };
  users.set(userId, newUser);
  wsToUserId.set(ws, userId);
  sendMessage(ws, 'reg', { name, index: userId, error: false });
  console.log(`User registered: ${name}`);
};

const handleMessage = (ws: WebSocket, rawMessage: string): void => {
  const message = parseMessage(rawMessage);

  if (!message) {
    sendMessage(ws, 'error', { message: 'Invalid message format' });
    return;
  }

  try {
    switch (message.type) {
      case 'reg':
        handleRegistration(ws, message.data);
        break;
      default:
        sendMessage(ws, 'error', { message: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendMessage(ws, 'error', { message: 'Internal server error' });
  }
};

const handleDisconnection = (ws: WebSocket): void => {
  const userId = wsToUserId.get(ws);
  if (userId) {
    const user = users.get(userId);
    if (user) {
      console.log(`User disconnected: ${user.name}`);
    }
    wsToUserId.delete(ws);
  }
};

wss.on('connection', (ws: WebSocket) => {
  console.log('New connection established');

  ws.on('message', (rawMessage: Buffer) => {
    handleMessage(ws, rawMessage.toString());
  });

  ws.on('close', () => {
    handleDisconnection(ws);
  });

  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);