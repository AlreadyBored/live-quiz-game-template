import { WebSocketServer } from 'ws';
import { WSMessage } from './types';
import { handlerMessage } from './handlers/mainHandler';
import { WS_TO_USER } from './store/store';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  console.log('Connected');

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      handlerMessage(ws, data);
    } catch (error) {
      console.log('Invalid JSON');
      return;
    }
  });

  ws.on('close', () => {
    const userName = WS_TO_USER.get(ws);
    WS_TO_USER.delete(ws);
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
