import { WebSocketServer } from 'ws';


const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  console.log('Client connected');
});

  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    // Broadcast the message to all connected clients

  });