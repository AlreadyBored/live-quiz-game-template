import { WebSocketServer } from "ws";
import { WSMessage, User, Game } from "./types";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const users: User[] = [];
const games: Game[] = [];
let userIdCounter = 1;
let gameIdCounter = 1;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws, request) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    const req: WSMessage = JSON.parse(message.toString());
    console.log("Received:", req);

    if (req.type === "reg") {
      const { name, password } = req.data;

      let user = users.find((u) => u.name === name && u.password === password);

      if (!user) {
        user = {
          name,
          password,
          index: String(userIdCounter++),
          ws,
        };
        users.push(user);
      } else {
        user.ws = ws;
      }

      ws.send(
        JSON.stringify({
          type: "reg",
          data: {
            name: user.name,
            index: user.index,
            error: false,
            errorText: "",
          },
          id: 0,
        }),
      );
    }

    if (req.type === "create_game") {
      ws.send(
        JSON.stringify({
          type: "game_created",
          data: {
            gameId: "1",
            code: "12344CSD",
          },
          id: 0,
        }),
      );
    }

    if (req.type === "join_game") {
      ws.send(
        JSON.stringify({
          type: "game_joined",
          data: {
            gameId: "1",
          },
          id: 0,
        }),
      );
    }

    if (req.type === "answer") {
      ws.send(
        JSON.stringify({
          type: "answer_accepted",
          data: {
            questionIndex: 1,
          },
          id: 0,
        }),
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});
