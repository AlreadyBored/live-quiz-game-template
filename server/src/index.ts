import { WebSocketServer } from 'ws';
import { handleMessage, socketToPlayer, games } from './handlers/messageHandler';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    handleMessage(ws, message.toString());
  });
});

wss.on('close', () => {
  const playerId = socketToPlayer.get(wss);
  if (!playerId) return;

  games.forEach((game) => {
    const index = game.players.findIndex((p: { index: string }) => p.index === playerId);
    if (index !== -1) {
      game.players.splice(index, 1);

      game.players.forEach((p: { index: string }) => {
        const playerSocket = [...socketToPlayer.entries()]
          .find(([_, id]) => id === p.index)?.[0];

        playerSocket?.send(
          JSON.stringify({
            type: 'update_players',
            data: game.players,
            id: 0,
          })
        );
      });
    }
  });
  socketToPlayer.delete(wss);
});