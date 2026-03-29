import { Game, WSMessage } from "../types";

export function broadcast(game: Game, ...responses: WSMessage[]) {
  responses.forEach((response) => {
    game.players.forEach((p) => {
      if (!p.ws) return;
      p.ws.send(JSON.stringify(response));
    });
  });
}
