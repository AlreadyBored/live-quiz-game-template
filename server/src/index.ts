import { WebSocketServer } from 'ws';
import { setupWebSocketServer } from './server';
import { setupRestApi } from './rest';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

const wss = new WebSocketServer({ port: PORT });

setupWebSocketServer(wss);
setupRestApi().catch((err) => console.error('[REST Error]', err));

console.log(`
╔══════════════════════════════════════════════════════════╗
║     🎮 Live Quiz Game - WebSocket Server                 ║
╠══════════════════════════════════════════════════════════╣
║  Server started at: ${new Date().toISOString()}             ║
║  Address: ws://localhost:${PORT}                            ║ 
║  Port: ${PORT}                                              ║
║  REST: http://localhost:${process.env.FASTIFY_PORT || 3000}                 ║
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