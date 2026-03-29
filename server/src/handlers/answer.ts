import { WebSocket } from 'ws';
import type { AnswerData, Game } from '../types.js';
import { wsToUser, games } from '../storage.js';
import { send, broadcast, getGameSockets } from '../helpers.js';
import { sendQuestion } from './startGame.js';

const BASE_POINTS = 1000;

export function handleAnswer(ws: WebSocket, data: AnswerData): void {
  const user = wsToUser.get(ws);
  if (!user) {
    send(ws, 'error', { message: 'You must register first' });
    return;
  }

  const game = games.get(data.gameId);
  if (!game) {
    send(ws, 'error', { message: 'Game not found' });
    return;
  }

  if (game.status !== 'in_progress') {
    send(ws, 'error', { message: 'Game is not in progress' });
    return;
  }

  if (game.currentQuestion !== data.questionIndex) {
    send(ws, 'error', { message: 'Wrong question index' });
    return;
  }

  const player = game.players.find((p) => p.index === user.index);
  if (!player) {
    send(ws, 'error', { message: 'You are not in this game' });
    return;
  }

  if (player.hasAnswered) {
    send(ws, 'error', { message: 'Already answered' });
    return;
  }

  player.hasAnswered = true;
  player.answerTime = Date.now();
  game.playerAnswers.set(user.index, {
    answerIndex: data.answerIndex,
    timestamp: Date.now(),
  });

  send(ws, 'answer_accepted', { questionIndex: data.questionIndex });

  if (game.players.every((p) => p.hasAnswered)) {
    clearTimeout(game.questionTimer);
    endQuestion(game);
  }
}

export function endQuestion(game: Game): void {
  const q = game.questions[game.currentQuestion];
  const startTime = game.questionStartTime!;
  const timeLimitMs = q.timeLimitSec * 1000;

  const playerResults = game.players.map((player) => {
    const answer = game.playerAnswers.get(player.index);
    const answered = !!answer;
    const correct = answered && answer.answerIndex === q.correctIndex;

    let pointsEarned = 0;
    if (correct) {
      const timeRemaining = Math.max(0, timeLimitMs - (answer!.timestamp - startTime));
      pointsEarned = Math.round(BASE_POINTS * (timeRemaining / timeLimitMs));
    }

    player.score += pointsEarned;

    return {
      name: player.name,
      answered,
      correct,
      pointsEarned,
      totalScore: player.score,
    };
  });

  const allSockets = getGameSockets(game, wsToUser);

  broadcast(allSockets, 'question_result', {
    questionIndex: game.currentQuestion,
    correctIndex: q.correctIndex,
    playerResults,
  });

  game.currentQuestion++;

  if (game.currentQuestion < game.questions.length) {
    setTimeout(() => sendQuestion(game), 3000);
  } else {
    game.status = 'finished';
    const sorted = [...game.players].sort((a, b) => b.score - a.score);
    broadcast(allSockets, 'game_finished', {
      scoreboard: sorted.map((p, i) => ({ name: p.name, score: p.score, rank: i + 1 })),
    });
  }
}