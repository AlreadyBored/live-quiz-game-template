import { RawData } from "ws";
import { isMessage } from "./isMessage";
import { Player, RegData, WSMessage } from "../types";
import { randomUUID } from "node:crypto";
import { players } from "../db/db";
import type { WebSocket } from "ws";

export function messageHandler(ws: WebSocket, data: RawData) {
  const message = JSON.parse(data.toString());
  if (!isMessage(message)) return;

  switch (message.type) {
    case "reg": {
      const data = message.data as RegData;
      const player = players.get(ws);

      const response: WSMessage = {
        type: "reg",
        data: {
          name: data.name,
          error: false,
          errorText: "",
        },
        id: 0,
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

      ws.send(JSON.stringify(response));
      break;
    }
    
    default:
      break;
  }
}
