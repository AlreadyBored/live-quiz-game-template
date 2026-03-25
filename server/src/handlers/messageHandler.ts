const players = new Map<string, { name: string; index: string; score: number }>();

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

const socketToPlayer = new Map<any, string>();

export function handleMessage(ws: any, message: string) {
  const parsed = JSON.parse(message);
  const { type, data, id } = parsed;

  if (type === 'reg') {
    const { name } = data;

    const playerId = generateId();

    const player = {
      name,
      index: playerId,
      score: 0,
    };

    players.set(playerId, player);
  socketToPlayer.set(ws, playerId);
    ws.send(
      JSON.stringify({
        type: 'reg',
        data: {
          name: player.name,
          index: player.index,
          error: false,
          errorText: '',
        },
        id: 0,
      })
    );

  }
}