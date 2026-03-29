import type { WebSocket } from 'ws';
import type { Game, Player, Question } from './types.js';

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const BASE_POINTS = 1000;

// ---------------------------------------------------------------------------
// Отправка сообщений
// ---------------------------------------------------------------------------

/**
 * Отправляет JSON-сообщение конкретному клиенту.
 * Проверяет readyState: 1 === WebSocket.OPEN.
 * Использует числовую константу, чтобы не импортировать WebSocket как значение.
 */
export function sendMessage(ws: WebSocket | undefined, type: string, data: unknown): void {
  if (!ws || ws.readyState !== 1) return;
  ws.send(JSON.stringify({ type, data, id: 0 }));
}

export function sendError(ws: WebSocket | undefined, message: string): void {
  sendMessage(ws, 'error', { message });
}

/**
 * Рассылает сообщение всем игрокам в игре (включая хоста).
 * Хост тоже хранится в game.players, поэтому broadcast работает одинаково для всех.
 */
export function broadcastToGame(game: Game, type: string, data: unknown): void {
  for (const player of game.players) {
    sendMessage(player.ws, type, data);
  }
}

// ---------------------------------------------------------------------------
// Генерация идентификаторов
// ---------------------------------------------------------------------------

/** Уникальный ID на основе timestamp + случайной строки. */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function generateRoomCode(existingCodes: Set<string>): string {
  let code = '';
  do {
    code = Array.from(
      { length: 6 },
      () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
    ).join('');
  } while (existingCodes.has(code));
  return code;
}

// ---------------------------------------------------------------------------
// Валидация
// ---------------------------------------------------------------------------

/** Проверяет, что вопрос соответствует требованиям задания. */
export function isQuestionValid(q: Question): boolean {
  return (
    typeof q.text === 'string' &&
    q.text.trim().length > 0 &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.options.every((opt) => typeof opt === 'string' && opt.trim().length > 0) &&
    Number.isInteger(q.correctIndex) &&
    q.correctIndex >= 0 &&
    q.correctIndex <= 3 &&
    typeof q.timeLimitSec === 'number' &&
    Number.isFinite(q.timeLimitSec) &&
    q.timeLimitSec > 0
  );
}

// ---------------------------------------------------------------------------
// Подсчёт очков
// ---------------------------------------------------------------------------

/**
 * Формула из задания: basePoints * (timeRemaining / timeLimit).
 * Оба аргумента — в миллисекундах.
 * Возвращает 0 при некорректных значениях (неверный ответ или таймаут).
 */
export function calculateScore(timeRemainingMs: number, timeLimitMs: number): number {
  if (timeRemainingMs <= 0 || timeLimitMs <= 0) return 0;
  return Math.round(BASE_POINTS * Math.min(1, timeRemainingMs / timeLimitMs));
}

// ---------------------------------------------------------------------------
// Утилиты для работы с игроками
// ---------------------------------------------------------------------------

/**
 * Возвращает массив игроков без внутренних полей (ws, hasAnswered и т.д.).
 * Именно этот формат уходит клиенту в update_players.
 */
export function toPublicPlayers(players: Player[]): Array<Pick<Player, 'name' | 'index' | 'score'>> {
  return players.map(({ name, index, score }) => ({ name, index, score }));
}

// ---------------------------------------------------------------------------
// Очистка таймеров
// ---------------------------------------------------------------------------

/**
 * Отменяет оба таймера игры (вопрос + пауза перед следующим вопросом).
 * Вызывается при дисконнекте, завершении игры или перед запуском нового вопроса.
 */
export function cleanupGameTimers(game: Game): void {
  if (game.questionTimer) {
    clearTimeout(game.questionTimer);
    game.questionTimer = undefined;
  }
  if (game.transitionTimer) {
    clearTimeout(game.transitionTimer);
    game.transitionTimer = undefined;
  }
}
