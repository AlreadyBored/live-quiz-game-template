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
const codes   = new Map<string, string>(); // code → gameId
 
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
      return `Question ${i + 1}: correctIndex must be 0-3`;
    }
    if (typeof q.timeLimitSec !== 'number' || q.timeLimitSec <= 0) {
      return `Question ${i + 1}: timeLimitSec must be a positive number`;
    }
  }
  return null;
};
 
// Calculate speed-based points — max 1000 (instant), min 100 (at time limit)
const calcPoints = (
  timeLimitSec    : number,
  answeredAt      : number,
  questionStartTime: number
): number => {
  const elapsed   = (answeredAt - questionStartTime) / 1000;
  const timeRatio = Math.max(0, 1 - elapsed / timeLimitSec);
  return Math.round(100 + 900 * timeRatio);
};

// ═══════════════════════════════════════════════════════════════════
// Game Logic
// ═══════════════════════════════════════════════════════════════════
 
// Send current question to everyone — without correctIndex
const sendQuestion = (game: Game): void => {
  const q = game.questions[game.currentQuestion];
  if (!q) return;
 
  // Reset per-question state
  game.playerAnswers     = new Map();
  game.questionStartTime = Date.now();
 
  // Reset player answer flags
  for (const player of game.players) {
    player.hasAnswered       = false;
    player.answeredCorrectly = false;
    player.answerTime        = undefined;
  }
 
  if (game.questionTimer) clearTimeout(game.questionTimer);
 
  // Broadcast question WITHOUT correctIndex
  broadcast(game, 'question', {
    questionNumber: game.currentQuestion + 1,
    totalQuestions: game.questions.length,
    text          : q.text,
    options       : q.options,
    timeLimitSec  : q.timeLimitSec,
  });
 
  // Server-side timer — auto-end when time expires
  game.questionTimer = setTimeout(() => {
    endQuestion(game);
  }, q.timeLimitSec * 1000);
};
 
// End current question — broadcast correct answer + scores
const endQuestion = (game: Game): void => {
  if (!games.has(game.id)) return;
 
  if (game.questionTimer) {
    clearTimeout(game.questionTimer);
    game.questionTimer = undefined;
  }
 
  const q             = game.questions[game.currentQuestion];
  const playerResults = game.players.map(player => {
    const answer = game.playerAnswers.get(player.index);
 
    if (!answer) {
      return {
        name        : player.name,
        answered    : false,
        correct     : false,
        pointsEarned: 0,
        totalScore  : player.score,
      };
    }
 
    const isCorrect    = answer.answerIndex === q.correctIndex;
    const pointsEarned = isCorrect
      ? calcPoints(q.timeLimitSec, answer.timestamp, game.questionStartTime!)
      : 0;
 
    if (isCorrect) player.score += pointsEarned;
 
    return {
      name        : player.name,
      answered    : true,
      correct     : isCorrect,
      pointsEarned,
      totalScore  : player.score,
    };
  });
 
  // Broadcast question_result with correctIndex revealed
  broadcast(game, 'question_result', {
    questionIndex: game.currentQuestion,
    correctIndex : q.correctIndex,
    playerResults,
  });
 
  game.currentQuestion++;
 
  if (game.currentQuestion < game.questions.length) {
    // Send next question after short delay
    setTimeout(() => sendQuestion(game), 3000);
  } else {
    finishGame(game);
  }
};
 
// Finish game — broadcast final scoreboard with ranks
const finishGame = (game: Game): void => {
  game.status = 'finished';
 
  const scoreboard = [...game.players]
    .sort((a, b) => b.score - a.score)
    .map((p, idx) => ({ name: p.name, score: p.score, rank: idx + 1 }));
 
  broadcast(game, 'game_finished', { scoreboard });
 
  // Cleanup
  games.delete(game.id);
  codes.delete(game.code);
};
 
// Handle player disconnect — remove from game, notify others
const handleDisconnect = (playerIndex: string): void => {
  console.log(`Disconnected: ${playerIndex}`);
 
  for (const [, game] of games) {
    const idx = game.players.findIndex(p => p.index === playerIndex);
    if (idx !== -1) {
      game.players.splice(idx, 1);
      broadcast(game, 'update_players', getPlayerList(game));
 
      // Cleanup if no players and game still waiting
      if (game.players.length === 0 && game.status === 'waiting') {
        if (game.questionTimer) clearTimeout(game.questionTimer);
        games.delete(game.id);
        codes.delete(game.code);
      }
      break;
    }
  }
};