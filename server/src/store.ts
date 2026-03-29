import type { WebSocket } from "ws";
import type { Game, User } from "./types.js";

export const usersById = new Map<string, User>();
export const userIdByName = new Map<string, string>();

export const socketsByUserId = new Map<string, WebSocket>();
export const userIdBySocket = new Map<WebSocket, string>();

export const gamesById = new Map<string, Game>();
export const gameByCode = new Map<string, Game>();

let nextUserId = 1;

export const generateUserId = (): string => {
  return String(nextUserId++);
};

let nextGameId = 1;

export const generateGameId = (): string => {
  return String(nextGameId++);
};

export const generateGameCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const code = Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");

  return gameByCode.has(code) ? generateGameCode() : code;
};
