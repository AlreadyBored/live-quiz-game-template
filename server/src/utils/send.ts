import type { WebSocket } from "ws";

export const send = (ws: WebSocket, type: string, data: unknown): void => {
  const msg = JSON.stringify({ type, data, id: 0 });
  console.log("sending message:", msg);
  ws.send(msg);
};
