import { RawData } from "ws";
import { isMessage } from "./isMessage";
import {
  CreateGameData,
  Game,
  JoinGameData,
  Player,
  RegData,
  WSMessage,
} from "../types";
import { randomUUID } from "node:crypto";
import { games, players } from "../db/db";
import { Server, WebSocket } from "ws";
import { generateCode } from "./generateCode";

export function messageHandler(ws: WebSocket, data: RawData, wss: Server) {
  const message = JSON.parse(data.toString());
  console.log(data.toString());
  if (!isMessage(message)) return;

  const response: WSMessage = {
    type: "",
    data: null,
    id: 0,
  };

  switch (message.type) {
    case "reg": {
      const data = message.data as RegData;
      const player = players.get(ws);

      response.type = "reg";
      response.data = {
        name: data.name,
        error: false,
        errorText: "",
      };

      if (player) {
        response.data.index = player.index;
      } else {
        const newPlayer: Player = {
          name: data.name,
          index: randomUUID(),
          score: 0,
          ws,
        };
        players.set(ws, newPlayer);
        response.data.index = newPlayer.index;
      }
      break;
    }
    case "create_game": {
      const data = message.data as CreateGameData;
      const host = players.get(ws);
      if (!host || !host.ws) return;
      const game: Game = {
        id: randomUUID(),
        code: generateCode(),
        hostId: host.index,
        hostWs: host.ws,
        questions: data.questions,
        players: [],
        currentQuestion: 0,
        status: "waiting",
        playerAnswers: new Map(),
      };
      games.set(game.code, game);

      response.type = "game_created";
      response.data = {
        gameId: game.id,
        code: game.code,
      };
      break;
    }
    case "join_game": {
      const data = message.data as JoinGameData;
      const game = games.get(data.code);
      const player = players.get(ws);
      if (!game || !player) return;

      if (!game.players.includes(player)) {
        game.players.push(player);
      }

      response.type = "game_joined";
      response.data = {
        gameId: game.id,
      };

      ws.send(JSON.stringify(response));

      const joinResponse: WSMessage = {
        type: "player_joined",
        data: {
          playerName: player.name,
          playerCount: game.players.length,
        },
        id: 0,
      };

      const updateResponse: WSMessage = {
        type: "update_players",
        data: game.players.map((p) => ({
          name: p.name,
          index: p.index,
          score: p.score,
        })),
        id: 0,
      };

      game.hostWs.send(JSON.stringify(updateResponse));
      game.players.forEach((p) => {
        if (!p.ws) return;
        p.ws.send(JSON.stringify(joinResponse));
        p.ws.send(JSON.stringify(updateResponse));
      });
      return;
    }
    default:
      break;
  }

  ws.send(JSON.stringify(response));
}
