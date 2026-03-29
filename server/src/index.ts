import { WebSocketServer } from "ws";
import type { WSMessage } from "./types.js";
import { userIdBySocket, socketsByUserId } from "./store.js";
import { dispatch } from "./handlers/index.js";

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
    const userId = userIdBySocket.get(ws);
    if (userId) {
      userIdBySocket.delete(ws);
      socketsByUserId.delete(userId);
    }
    console.log(`client ${userId} disconnected`);
  });
});

console.log(`WebSocket server started on ws://localhost:${PORT}`);
