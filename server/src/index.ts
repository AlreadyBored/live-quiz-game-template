import WebSocket, { WebSocketServer } from 'ws';
import { CreateGameData, Game, Player, RegData, User, WSMessage } from './types';
import { v4 as uuidv4 } from 'uuid';
import { error } from 'node:console';



const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const wss = new WebSocketServer({ port: PORT });
console.log(`WebSocket server running on ws://localhost:${PORT}`);

const users: Record<string, User> = {};
const games: Record<string, Game> = {};
const players: Record<string, Player> = {};

wss.on('connection', (ws: WebSocket) => {
    let currentUserId: string | null = null;

    ws.on('message', (msg) => {
        try{
            const message: WSMessage = JSON.parse(msg.toString());
            handleMessage(ws, message);
        } catch (error) {
            console.error('Invalid message', error);
        }
    });

    ws.on('close', () => {
        console.error('Invalid message', error);
    });

    function handleMessage(ws: WebSocket, msg: WSMessage) {
        const {type, data} = msg;

        switch (type) {
            case 'reg': 
               currentUserId = handleReg(ws, data as RegData);
               break;
            case 'create game':
                handleCreateGame(ws, data as CreateGameData, currentUserId!);
                break;


        }
    }
});

function handleReg(ws: WebSocket, data: RegData): string {
    const userId = uuidv4();

  const user: User = {
    name: data.name,
    password: data.password,
    index: userId,
    ws
  };

  users[userId] = user;
  const player: Player = {
    name: data.name,
    index: userId,
    score: 0,
    ws
   };
   players[userId] = player;

   ws.send(JSON.stringify({
    type: 'reg',
    data: {name: data.name, index: userId, error: false, errorText: '' },
    id: 0
   }));

   return userId;
}

function handleCreateGame(ws: WebSocket, data: CreateGameData, hostId: string) {
    const gameId = uuidv4();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const game: Game = {
    id: gameId,
    code,
    hostId,
    questions: data.questions,
    players: [],
    currentQuestion: -1,
    status: 'waiting',
    playerAnswers: new Map()
  };

    games[gameId] = game;

    ws.send(JSON.stringify({
        type: 'game_created',
        data: { gameId, code },
        id: 0
    }));
}