import type { WebSocket } from "ws";
import type { User } from "./types.js";

export const usersById = new Map<string, User>();
export const userIdByName = new Map<string, string>();

export const socketsByUserId = new Map<string, WebSocket>();
export const userIdBySocket = new Map<WebSocket, string>();

let nextUserId = 1;

export const generateUserId = (): string => {
  return String(nextUserId++);
};
