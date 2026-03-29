import 'dotenv/config';
import { WebSocketServer } from 'ws';
import type { WSMessage, RegData, CreateGameData, JoinGameData, StartGameData, AnswerData } from './types.js';
import { handleReg } from './handlers/reg.js';
import { handleCreateGame } from './handlers/createGame.js';
import { handleJoinGame } from './handlers/joinGame.js';
import { handleStartGame } from './handlers/startGame.js';
import { handleAnswer } from './handlers/answer.js';
import { handleDisconnect } from './handlers/disconnect.js';

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
      case 'create_game':
        handleCreateGame(ws, msg.data as CreateGameData);
        break;
      case 'join_game':
        handleJoinGame(ws, msg.data as JoinGameData);
        break;
      case 'start_game':
        handleStartGame(ws, msg.data as StartGameData);
        break;
      case 'answer':
        handleAnswer(ws, msg.data as AnswerData);
        break;
    }
  });

  ws.on('close', () => handleDisconnect(ws));
});