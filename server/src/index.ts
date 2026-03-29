import { WebSocketServer } from "ws";
import type { WSMessage } from "./types.js";
import { dispatch } from "./handlers/index.js";
import { disconnectUser, removePlayerFromGame } from "./handlers/disconnect.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  console.log("client connected");

  ws.on("message", (raw) => {
    const msg: WSMessage = JSON.parse(String(raw));
    console.log("received message:", msg);

    dispatch(ws, msg.type, msg.data);
  });

  ws.on("close", () => {
    const userId = disconnectUser(ws);

    if (!userId) {
      console.log("unknown user disconnected");
      return;
    }

    removePlayerFromGame(userId);

    console.log(`userId ${userId} disconnected`);
  });
});

console.log(`WebSocket server started on ws://localhost:${PORT}`);
