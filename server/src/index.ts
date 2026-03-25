import { WebSocketServer } from 'ws';
import { handleMessage } from './handlers/messageHandler';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    handleMessage(ws, message.toString());
  });
});