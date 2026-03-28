import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createContext } from './state.js';
import type { WSMessage } from './types.js';
import { sendError } from './utils.js';

dotenv.config();

const DEFAULT_PORT = 3000;

export function createServer(port = DEFAULT_PORT): WebSocketServer {
  const context = createContext();
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws) => {
    ws.on('message', (rawMessage) => {
      let message: WSMessage;
      try {
        message = JSON.parse(rawMessage.toString()) as WSMessage;
      } catch {
        sendError(ws, 'Invalid JSON');
        return;
      }

      const { type, data } = message;

      switch (type) {
        // TODO: Implement message handlers
        default:
          sendError(ws, `Unknown command: ${type}`);
      }
    });

    ws.on('close', () => {
      const userId = context.wsToUserId.get(ws);
      context.wsToUserId.delete(ws);

      if (userId) {
        const user = context.usersById.get(userId);
        if (user) {
          user.ws = undefined;
        }
      }
    });
  });

  return wss;
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;
const wss = createServer(port);
console.log(`WebSocket server started at ws://localhost:${port}`);
