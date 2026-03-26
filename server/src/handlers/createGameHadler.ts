import { randomUUID } from 'node:crypto';
import { Game, WebSocketType } from '../types';
import { generateCode, getUserByWs } from '../utils';
import { CODE_TO_GAME, GAMES } from '../store/store';

export const createGameHadler = (ws: WebSocketType, data: any) => {
  const user = getUserByWs(ws);
  const roomCode = generateCode();
  const gameId = randomUUID();

  if (!user) {
    console.log('User not found');
    return;
  }

  const game: Game = {
    id: gameId,
    code: roomCode,
    hostId: user?.index || '',
    questions: data.questions,
    players: [],
    currentQuestion: -1,
    status: 'waiting',
    playerAnswers: new Map(),
  };

  GAMES.set(gameId, game);
  CODE_TO_GAME.set(roomCode, gameId);

  ws.send(
    JSON.stringify({
      type: 'game_created',
      data: {
        gameId,
        code: roomCode,
      },
      id: 0,
    }),
  );
};
