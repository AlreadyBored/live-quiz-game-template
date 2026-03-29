import 'dotenv/config';
import { WebSocketServer } from 'ws';
import type { WSMessage, RegData } from './types.js';
import { handleReg } from './handlers/reg.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const wss = new WebSocketServer({ port: PORT }, () => {
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});

wss.on('connection', (ws) => {
  ws.on('message', (raw: Buffer) => {
    let msg: WSMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case 'reg':
        handleReg(ws, msg.data as RegData);
        break;
    }
  });
});