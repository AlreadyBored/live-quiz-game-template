import type { WebSocket } from 'ws';
import type { AnswerData, Game, Question, ServerContext } from '../types.js';
import {
  broadcastToGame,
  calculateScore,
  cleanupGameTimers,
  sendError,
  sendMessage,
  toPublicPlayers,
} from '../utils.js';

const NEXT_QUESTION_DELAY_MS = 3000;

function getPlayablePlayers(game: Game) {
  return game.players.filter((p) => p.index !== game.hostId);
}

function buildQuestionPayload(game: Game, question: Question) {
  return {
    questionNumber: game.currentQuestion + 1,
    totalQuestions: game.questions.length,
    text: question.text,
    options: question.options,
    timeLimitSec: question.timeLimitSec,
  };
}

export function startQuestion(context: ServerContext, game: Game): void {
  cleanupGameTimers(game);
  game.playerAnswers.clear();

  const question = game.questions[game.currentQuestion];
  if (!question) {
    return;
  }

  game.questionStartTime = Date.now();
  broadcastToGame(game, 'question', buildQuestionPayload(game, question));

  const timeLimitMs = Math.round(question.timeLimitSec * 1000);
  game.questionTimer = setTimeout(() => {
    resolveQuestion(context, game.id);
  }, timeLimitMs);
}

export function handleAnswer(context: ServerContext, ws: WebSocket, data: AnswerData): void {
  const userId = context.wsToUserId.get(ws);
  if (!userId) {
    sendError(ws, 'You must register first');
    return;
  }

  const gameId = typeof data?.gameId === 'string' ? data.gameId : '';
  const game = gameId ? context.gamesById.get(gameId) : undefined;
  if (!game) {
    sendError(ws, 'Game not found');
    return;
  }

  if (context.userIdToGameId.get(userId) !== game.id) {
    sendError(ws, 'You are not in this game');
    return;
  }

  if (game.status !== 'in_progress') {
    sendError(ws, 'Game is not in progress');
    return;
  }

  if (userId === game.hostId) {
    sendError(ws, 'Host cannot submit answers');
    return;
  }

  if (!game.players.some((p) => p.index === userId)) {
    sendError(ws, 'Player not in room');
    return;
  }

  if (data.questionIndex !== game.currentQuestion) {
    sendError(ws, 'Invalid question index');
    return;
  }

  if (
    !Number.isInteger(data.answerIndex) ||
    data.answerIndex < 0 ||
    data.answerIndex > 3
  ) {
    sendError(ws, 'Invalid answer index');
    return;
  }

  if (game.playerAnswers.has(userId)) {
    sendError(ws, 'Answer already submitted');
    return;
  }

  game.playerAnswers.set(userId, {
    answerIndex: data.answerIndex,
    timestamp: Date.now(),
  });

  sendMessage(ws, 'answer_accepted', { questionIndex: data.questionIndex });

  const playable = getPlayablePlayers(game);
  if (playable.length > 0 && game.playerAnswers.size >= playable.length) {
    resolveQuestion(context, game.id);
  }
}

export function resolveQuestion(context: ServerContext, gameId: string): void {
  const game = context.gamesById.get(gameId);
  if (!game || game.status !== 'in_progress') {
    return;
  }

  if (game.questionTimer) {
    clearTimeout(game.questionTimer);
    game.questionTimer = undefined;
  }

  const question = game.questions[game.currentQuestion];
  const questionStart = game.questionStartTime ?? Date.now();
  if (!question) {
    return;
  }

  const timeLimitMs = Math.round(question.timeLimitSec * 1000);
  const playable = getPlayablePlayers(game);

  const playerResults = playable.map((player) => {
    const stored = game.playerAnswers.get(player.index);
    const answered = Boolean(stored);
    const correct = answered ? stored!.answerIndex === question.correctIndex : false;
    const elapsedMs = answered ? Math.max(0, stored!.timestamp - questionStart) : timeLimitMs;
    const timeRemainingMs = Math.max(0, timeLimitMs - elapsedMs);
    const pointsEarned = correct ? calculateScore(timeRemainingMs, timeLimitMs) : 0;
    player.score += pointsEarned;
    return {
      name: player.name,
      answered,
      correct,
      pointsEarned,
      totalScore: player.score,
    };
  });

  broadcastToGame(game, 'question_result', {
    questionIndex: game.currentQuestion,
    correctIndex: question.correctIndex,
    playerResults,
  });
  broadcastToGame(game, 'update_players', toPublicPlayers(game.players));

  game.transitionTimer = setTimeout(() => {
    const g = context.gamesById.get(gameId);
    if (!g || g.status !== 'in_progress') {
      return;
    }

    if (g.currentQuestion >= g.questions.length - 1) {
      g.status = 'finished';
      cleanupGameTimers(g);
      const sorted = [...getPlayablePlayers(g)].sort((a, b) => b.score - a.score);
      const scoreboard = sorted.map((p, i) => ({
        name: p.name,
        score: p.score,
        rank: i + 1,
      }));
      broadcastToGame(g, 'game_finished', { scoreboard });
      return;
    }

    g.currentQuestion += 1;
    startQuestion(context, g);
  }, NEXT_QUESTION_DELAY_MS);
}
