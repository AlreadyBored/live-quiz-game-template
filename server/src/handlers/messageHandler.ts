const players = new Map<string, { name: string; index: string; score: number }>();
const games = new Map<string, any>();

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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
  if(type === 'game_created') {
    const playerId = socketToPlayer.get(ws);
     if (!playerId) return;
    const { questions } = data;

    const gameId = generateId();
    const code = generateCode();

    const game = {
    id: gameId,
    code,
    hostId: playerId,
    questions,
    players: [],
    currentQuestion: -1,
    status: 'waiting',
  };
 games.set(gameId, game);

   ws.send(
    JSON.stringify({
      type: 'game_created',
      data: {
        gameId,
        code,
      },
      id: 0,
    })
  );
  }
    if(type === 'game_joined') {
    
  }
    if(type === 'player_joined') {
    
  }
    if(type === 'update_players') {
    
  }
    if(type === 'game_created') {
    
  }
    if(type === 'answer_accepted') {
    
  }
    if(type === 'question_result') {
    
  }
    if(type === 'game_finished') {
    
  }
    if(type === 'error') {
    
  }

}