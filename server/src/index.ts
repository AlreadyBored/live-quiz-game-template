import { WebSocketServer, WebSocket } from 'ws';
import {
  Game,
  Question,
  User,
} from './types.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });
 
console.log(`WebSocket server is running on ws://localhost:${PORT}`);
 
// In-memory stores 
const users   = new Map<string, User>();   // name → User
const games   = new Map<string, Game>();   // gameId → Game 


// Send JSON message to one WebSocket
const send = (ws: WebSocket, type: string, data: unknown): void => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data, id: 0 }));
  }
};
 
// Send error message to one WebSocket
const sendError = (ws: WebSocket, errorText: string): void => {
  send(ws, 'error', { error: true, errorText });
};
 
// Broadcast message to all players in a game + host
const broadcast = (game: Game, type: string, data: unknown): void => {
  for (const player of game.players) {
    if (player.ws) send(player.ws, type, data);
  }
// Also notify host if not already a player
  const hostIsPlayer = game.players.some(p => p.index === game.hostId);
  if (!hostIsPlayer) {
    const host = [...users.values()].find(u => u.index === game.hostId);
    if (host?.ws) send(host.ws, type, data);
  }
};
 
// Generate unique 6-char uppercase room code
const generateCode = (): string =>
  Math.random().toString(36).substring(2, 8).toUpperCase();
 
// Get player list for update_players — name, index, score only
const getPlayerList = (game: Game) =>
  game.players.map(p => ({ name: p.name, index: p.index, score: p.score }));

// Validate questions array
const validateQuestions = (questions: unknown): string | null => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return 'questions must be a non-empty array';
  }
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i] as Partial<Question>;
    if (!q.text || typeof q.text !== 'string' || q.text.trim() === '') {
      return `Question ${i + 1}: text is required`;
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return `Question ${i + 1}: options must have exactly 4 items`;
    }
    if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
      return `Question ${i + 1}: correctIndex must be 0–3`;
    }
    if (typeof q.timeLimitSec !== 'number' || q.timeLimitSec <= 0) {
      return `Question ${i + 1}: timeLimitSec must be a positive number`;
    }
  }
  return null;
};