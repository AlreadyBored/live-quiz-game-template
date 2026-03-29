import { Player } from "../types";
import type { WebSocket } from "ws";

export const players = new Map<WebSocket, Player>();
