import { WebSocketServer } from "ws";
import { WSMessage, User, Game } from "./types";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const users: User[] = [];
const games: Game[] = [];
let userIdCounter = 1;
let gameIdCounter = 1;

function broadcastToGame(gameId: string, type: string, data: any) {
  const game = games.find((g) => g.id === gameId);
  if (!game) return;

  const message = JSON.stringify({ type, data, id: 0 });
  game.players.forEach((player) => {
    if (player.ws?.readyState === 1) {
      player.ws.send(message);
    }
  });
}

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
      const { questions } = req.data;
      const user = users.find((u) => u.ws === ws);

      if (user) {
        const gameId = String(gameIdCounter++);
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const game: Game = {
          id: gameId,
          code,
          hostId: user.index,
          questions,
          players: [],
          currentQuestion: -1,
          status: "waiting",
          playerAnswers: new Map(),
        };

        games.push(game);

        ws.send(
          JSON.stringify({
            type: "game_created",
            data: {
              gameId,
              code,
            },
            id: 0,
          }),
        );
      }
    }

    if (req.type === "join_game") {
      const { code } = req.data;
      const user = users.find((u) => u.ws === ws);
      const game = games.find((g) => g.code === code);

      if (user && game) {
        const player = {
          name: user.name,
          index: user.index,
          score: 0,
          ws,
        };

        game.players.push(player);

        ws.send(
          JSON.stringify({
            type: "game_joined",
            data: {
              gameId: game.id,
            },
            id: 0,
          }),
        );

        broadcastToGame(game.id, "player_joined", {
          playerName: user.name,
          playerCount: game.players.length,
        });

        const playersList = game.players.map((p) => ({
          name: p.name,
          index: p.index,
          score: p.score,
        }));
        broadcastToGame(game.id, "update_players", playersList);
      }
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
