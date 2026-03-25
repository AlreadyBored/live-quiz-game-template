import { WebSocketServer } from 'ws';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  console.log('Connected');

  ws.on('message', (msg) => {
    console.log('Message:', msg.toString());
  });

  ws.on('close', () => {
    console.log('Close client');
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
