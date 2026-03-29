import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createContext } from './state.js';
import type { WSMessage } from './types.js';
import { sendError } from './utils.js';
import { handleReg } from './handlers/reg.js';
import { handleCreateGame, handleJoinGame, handleStartGame } from './handlers/game.js';
import { handleAnswer, handlePlayerDisconnect } from './handlers/play.js';

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
        case 'reg':
          handleReg(context, ws, data);
          break;
        case 'create_game':
          handleCreateGame(context, ws, data);
          break;
        case 'join_game':
          handleJoinGame(context, ws, data);
          break;
        case 'start_game':
          handleStartGame(context, ws, data);
          break;
        case 'answer':
          handleAnswer(context, ws, data);
          break;
        default:
          sendError(ws, `Unknown command: ${type}`);
      }
    });

    ws.on('close', () => {
      const userId = context.wsToUserId.get(ws);
      if (userId) {
        handlePlayerDisconnect(context, userId);
      }
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
