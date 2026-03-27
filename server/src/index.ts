import { WebSocketServer } from 'ws';
import { setupWebSocketServer } from './server.js';


const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const wss = new WebSocketServer({ port: PORT });

setupWebSocketServer(wss);

console.log(`
╔══════════════════════════════════════════════════════════╗
║     🎮 Live Quiz Game - WebSocket Server                 ║
╠══════════════════════════════════════════════════════════╣
║  Server started at: ${new Date().toISOString()}             ║
║  Address: ws://localhost:${PORT}                            ║ 
║  Port: ${PORT}                                              ║
╚══════════════════════════════════════════════════════════╝
`);

wss.on('error', (error) => {
    console.error('[Server Error]', error);
});

process.on('SIGINT', () => {
    console.log('\n[Shutdown] Received SIGINT. Closing server...');
    
    wss.clients.forEach((client) => {
        client.close();
    });
    
    wss.close(() => {
        console.log('[Shutdown] Server closed successfully');
        process.exit(0);
    });
});