import type { Game, BroadcastMessages } from "../types.js";
import { socketsByUserId } from "../store.js";

export const broadcastToGame = <T extends keyof BroadcastMessages>(
  game: Game,
  type: T,
  data: BroadcastMessages[T],
): void => {
  const msg = JSON.stringify({ type, data, id: 0 });

  const hostSocket = socketsByUserId.get(game.hostId);
  if (hostSocket) {
    hostSocket.send(msg);
  }

  for (const player of game.players) {
    const playerSocket = socketsByUserId.get(player.index);
    if (playerSocket) {
      playerSocket.send(msg);
    }
  }
};
