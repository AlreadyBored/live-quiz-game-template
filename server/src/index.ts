
import { WebSocketServer } from 'ws';
//import { handleConnection } from './server/connection-handler';


const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

const wss = new WebSocketServer({ port: PORT });

wss.on('listening', () => {
    console.log(`[Server] Listening on port ${PORT}`);
});

console.log(`
╔══════════════════════════════════════════════════════════╗
║     🎮 Live Quiz Game - WebSocket Server                 ║
╠══════════════════════════════════════════════════════════╣
║  Server started at: ${new Date().toISOString()}             ║
║  Address: ws://localhost:${PORT}                            ║ 
║  Port: ${PORT}                                              ║
╚══════════════════════════════════════════════════════════╝
`);

wss.on('connection', (ws) => {
    console.log(`[Connection] New client connected. Total connections: ${wss.clients.size}`);
    //handleConnection(ws);
});

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