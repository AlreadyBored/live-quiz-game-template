import type { WebSocket } from "ws";
import { send } from "./send.js";

export const sendError = (ws: WebSocket, message: string): void => {
  send(ws, "error", { message });
};
