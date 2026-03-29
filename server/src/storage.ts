import type { WebSocket } from 'ws';
import type { User, Game } from './types.js';

export const users = new Map<string, User>();
export const wsToUser = new Map<WebSocket, User>();
export const games = new Map<string, Game>();

export let userIdCounter = 0;
export let gameIdCounter = 0;

export function nextUserId(): string {
  return String(userIdCounter++);
}

export function nextGameId(): string {
  return String(gameIdCounter++);
}