import type { WebSocket } from "ws";
import { gamesByCode, gamesById, players } from "../db/db";
import { broadcast } from "./broadcast";
import { endQuestion } from "./endQuestion";
import { WSMessage } from "../types";

export function handleDisconnect(ws: WebSocket) {
  const player = players.get(ws);
  if (!player) return;

  players.delete(ws);

  for (const game of gamesById.values()) {
    const idx = game.players.indexOf(player);
    if (idx === -1) continue;

    game.players.splice(idx, 1);
    game.playerAnswers.delete(player.index);

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
    broadcast(game, updateResponse);

    if (
      game.status === "in_progress" &&
      game.players.length > 0 &&
      game.playerAnswers.size === game.players.length
    ) {
      clearTimeout(game.questionTimer);
      endQuestion(game, game.currentQuestion);
    }

    break;
  }
}
