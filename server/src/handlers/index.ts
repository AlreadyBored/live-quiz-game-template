import type { WebSocket } from "ws";
import type { IncomingMessages } from "../types.js";
import { handleReg } from "./reg.js";
import { handleCreateGame } from "./createGame.js";
import { handleJoinGame } from "./joinGame.js";
import { handleStartGame } from "./startGame.js";
import { handleAnswer } from "./answer.js";

type CommandHandler<T extends keyof IncomingMessages> = (
  ws: WebSocket,
  data: IncomingMessages[T],
) => void;

type Handlers = {
  [K in keyof IncomingMessages]: CommandHandler<K>;
};

const handlers: Handlers = {
  reg: handleReg,
  create_game: handleCreateGame,
  join_game: handleJoinGame,
  start_game: handleStartGame,
  answer: handleAnswer,
};

export const dispatch = <K extends keyof IncomingMessages>(
  ws: WebSocket,
  type: K,
  data: IncomingMessages[K],
): void => {
  const handler = handlers[type];
  if (handler) {
    handler(ws, data);
  } else {
    console.error("unknown message type:", type);
  }
};
