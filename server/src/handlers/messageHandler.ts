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
  if (type === 'join_game') {
  const playerId = socketToPlayer.get(ws);
  if (!playerId) return;

  const { code } = data;
  const game = Array.from(games.values()).find(g => g.code === code);
  if (!game) return;

  const player = players.get(playerId);
  if (!player) return;
  game.players.push(player);

  ws.send(
    JSON.stringify({
      type: 'game_joined',
      data: {
        gameId: game.id,
      },
      id: 0,
    })
  );

  game.players.forEach((p: { name: string; index: string; score: number }) => {
    const playerSocket = [...socketToPlayer.entries()]
      .find(([_, id]) => id === p.index)?.[0];

    playerSocket?.send(
      JSON.stringify({
        type: 'player_joined',
        data: {
          playerName: player.name,
          playerCount: game.players.length,
        },
        id: 0,
      })
    );
  });
  game.players.forEach((p: { name: string; index: string; score: number }) => {
    const playerSocket = [...socketToPlayer.entries()]
      .find(([_, id]) => id === p.index)?.[0];

    playerSocket?.send(
      JSON.stringify({
        type: 'update_players',
        data: game.players,
        id: 0,
      })
    );
  });
}

if (type === 'start_game') {
  const playerId = socketToPlayer.get(ws);
  if (!playerId) return;

  const { gameId } = data;

  const game = games.get(gameId);
  if (!game) return;

  if (game.hostId !== playerId) return;

  game.status = 'in_progress';
  game.currentQuestion = 0;

  const question = game.questions[0];

  game.players.forEach((p: { name: string; index: string; score: number }) => {
    const playerSocket = [...socketToPlayer.entries()]
      .find(([_, id]) => id === p.index)?.[0];

    playerSocket?.send(
      JSON.stringify({
        type: 'question',
        data: {
          questionNumber: 1,
          totalQuestions: game.questions.length,
          text: question.text,
          options: question.options,
          timeLimitSec: question.timeLimitSec,
        },
        id: 0,
      })
    );
  });
}

if (type === 'answer') {
  const playerId = socketToPlayer.get(ws);
  if (!playerId) return;

  const { gameId, questionIndex, answerIndex } = data;

  const game = games.get(gameId);
  if (!game) return;

  if (!game.answers) {
    game.answers = new Map();
  }

  game.answers.set(playerId, {
    answerIndex,
  });

  ws.send(
    JSON.stringify({
      type: 'answer_accepted',
      data: {
        questionIndex,
      },
      id: 0,
    })
  );
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