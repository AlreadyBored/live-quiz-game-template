import { RawData } from "ws";
import { isMessage } from "./isMessage";
import { CreateGameData, Game, Player, RegData, WSMessage } from "../types";
import { randomUUID } from "node:crypto";
import { games, players } from "../db/db";
import type { WebSocket } from "ws";
import { generateCode } from "./generateCode";

export function messageHandler(ws: WebSocket, data: RawData) {
  const message = JSON.parse(data.toString());
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
      if (!host) return;
      const game: Game = {
        id: randomUUID(),
        code: generateCode(),
        hostId: host.index,
        questions: data.questions,
        players: [],
        currentQuestion: 0,
        status: "waiting",
        playerAnswers: new Map(),
      };
      games.set(game.id, game);

      response.type = "game_created";
      response.data = {
        gameId: game.id,
        code: game.code,
      };
      break;
    }
    default:
      break;
  }

  ws.send(JSON.stringify(response));
}
