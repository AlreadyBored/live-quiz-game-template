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
  if(type === 'create_game') {
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
console.log('creating game...');
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
      data: { gameId: game.id },
      id: 0,
    })
  );
  const allSockets = [...socketToPlayer.keys()];

  allSockets.forEach(socket => {
    socket.send(
      JSON.stringify({
        type: 'update_players',
        data: game.players,
        id: 0,
      })
    );
    socket.send(
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

  const allSockets = [
  ...game.players.map((p: { name: string; index: string; score: number })  => [...socketToPlayer.entries()].find(([_, id]) => id === p.index)?.[0]).filter(Boolean),
  [...socketToPlayer.entries()].find(([_, id]) => id === game.hostId)?.[0]
].filter(Boolean);

allSockets.forEach(socket => {
  socket.send(
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
  game.answers = new Map();
game.questionStartTime = Date.now();

game.timer = setTimeout(() => {
  const correctIndex = question.correctIndex;

  const results = game.players.map((p: { name: string; index: string; score: number }) => {
    const answer = game.answers.get(p.index);

    const isCorrect = answer && answer.answerIndex === correctIndex;

    let points = 0;

    if (isCorrect) {
      const timeSpent = (Date.now() - game.questionStartTime) / 1000;
      const timeLeft = question.timeLimitSec - timeSpent;

      points = Math.max(0, Math.floor(1000 * (timeLeft / question.timeLimitSec)));
      p.score += points;
    }

    return {
      name: p.name,
      answered: !!answer,
      correct: !!isCorrect,
      pointsEarned: points,
      totalScore: p.score,
    };
  });

  game.players.forEach((p: { name: string; index: string; score: number }) => {
    const playerSocket = [...socketToPlayer.entries()]
      .find(([_, id]) => id === p.index)?.[0];

    playerSocket?.send(
      JSON.stringify({
        type: 'question_result',
        data: {
          questionIndex: game.currentQuestion,
          correctIndex,
          playerResults: results,
        },
        id: 0,
      })
    );
  });
}, question.timeLimitSec * 1000);
}

if (type === 'answer') {
  const playerId = socketToPlayer.get(ws);
  if (!playerId) return;

  const { gameId, questionIndex, answerIndex } = data;
  const game = games.get(gameId);
  if (!game) return;

  if (!game.answers) game.answers = new Map();

  game.answers.set(playerId, { answerIndex });

  ws.send(
    JSON.stringify({
      type: 'answer_accepted',
      data: { questionIndex },
      id: 0,
    })
  );

  if (game.answers.size === game.players.length) {
    clearTimeout(game.timer);
    processQuestionResults(game);
  }
}

}

function processQuestionResults(game: any) {
  const question = game.questions[game.currentQuestion];
  const correctIndex = question.correctIndex;

  const results = game.players.map((p: any) => {
    const answer = game.answers.get(p.index);
    const isCorrect = answer && answer.answerIndex === correctIndex;

    let points = 0;
    if (isCorrect) {
      const timeSpent = (Date.now() - game.questionStartTime) / 1000;
      const timeLeft = Math.max(0, question.timeLimitSec - timeSpent);
      points = Math.floor(1000 * (timeLeft / question.timeLimitSec));
      p.score += points;
    }

    return {
      name: p.name,
      answered: !!answer,
      correct: !!isCorrect,
      pointsEarned: points,
      totalScore: p.score,
    };
  });

  const allSockets = [
    ...game.players.map( (p: { name: string; index: string; score: number })=> [...socketToPlayer.entries()].find(([_, id]) => id === p.index)?.[0]).filter(Boolean),
    [...socketToPlayer.entries()].find(([_, id]) => id === game.hostId)?.[0]
  ].filter(Boolean);

  allSockets.forEach(socket => {
    socket.send(
      JSON.stringify({
        type: 'question_result',
        data: {
          questionIndex: game.currentQuestion,
          correctIndex,
          playerResults: results,
        },
        id: 0,
      })
    );
  });

  if (game.currentQuestion + 1 < game.questions.length) {
    game.currentQuestion += 1;
    game.answers = new Map();
    game.questionStartTime = Date.now();
    sendQuestionToAll(game);

    game.timer = setTimeout(() => processQuestionResults(game), question.timeLimitSec * 1000);
  } else {
    finishGame(game);
  }
}

function sendQuestionToAll(game: any) {
  const question = game.questions[game.currentQuestion];
  const allSockets = [
    ...game.players.map( (p: { name: string; index: string; score: number }) => [...socketToPlayer.entries()].find(([_, id]) => id === p.index)?.[0]).filter(Boolean),
    [...socketToPlayer.entries()].find(([_, id]) => id === game.hostId)?.[0]
  ].filter(Boolean);

  allSockets.forEach(socket => {
    socket.send(
      JSON.stringify({
        type: 'question',
        data: {
          questionNumber: game.currentQuestion + 1,
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

function finishGame(game: any) {
  const scoreboard = [...game.players]
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ name: p.name, score: p.score, rank: i + 1 }));

  const allSockets = [
    ...game.players.map( (p: { name: string; index: string; score: number }) => [...socketToPlayer.entries()].find(([_, id]) => id === p.index)?.[0]).filter(Boolean),
    [...socketToPlayer.entries()].find(([_, id]) => id === game.hostId)?.[0]
  ].filter(Boolean);

  allSockets.forEach(socket => {
    socket.send(
      JSON.stringify({
        type: 'game_finished',
        data: { scoreboard },
        id: 0,
      })
    );
  });

  game.status = 'finished';
  clearTimeout(game.timer);
}