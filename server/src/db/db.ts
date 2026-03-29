import { Game, Player } from "../types";
import type { WebSocket } from "ws";

export const players = new Map<WebSocket, Player>();

export const gamesByCode = new Map<string, Game>();
export const gamesById = new Map<string, Game>();