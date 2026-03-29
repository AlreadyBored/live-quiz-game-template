import type { WebSocket } from "ws";
import type { SendMessages } from "../types.js";

export const send = <T extends keyof SendMessages>(
  ws: WebSocket,
  type: T,
  data: SendMessages[T],
): void => {
  const msg = JSON.stringify({ type, data, id: 0 });
  console.log("sending message:", msg);
  ws.send(msg);
};
