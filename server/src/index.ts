import { WebSocketServer } from 'ws';


const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  ws.send('Welcome to the WebSocket server!');

  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    ws.send(`Server received: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

