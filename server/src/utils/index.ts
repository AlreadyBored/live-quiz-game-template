import { USERS, WS_TO_USER } from '../store/store';
import { Game, WebSocketType } from '../types';

export const getUserByWs = (ws: WebSocketType) => {
  const userName = WS_TO_USER.get(ws);

  if (!userName) return null;

  return USERS.get(userName) || null;
};

export const send = (ws: WebSocket, type: string, data: any) => {
  ws.send(
    JSON.stringify({
      type,
      data,
      id: 0,
    }),
  );
};

// export const broadcast = (game: Game, type: string, data: any) => {
//   game.players.forEach((player) => {
//     if (player.ws) {
//       send(player.ws, type, data);
//     }
//   });
// };

export const sendError = (ws: WebSocket, message: string) => {
  ws.send(
    JSON.stringify({
      type: 'error',
      data: {
        message,
      },
      id: 0,
    }),
  );
};

export const generateCode = () => {
  const chars = 'ABCDEFGHIJ0123456789KLMNOPQRSTUVWXYZ';

  let code = '';

  for (let i = 0; i < 6; i++) {
    const num = Math.floor(Math.random() * 20);
    code += chars[num || 0];
  }

  return code;
};
