import { RawData } from "ws";
import { isMessage } from "./isMessage";
import {
  AnswerData,
  CreateGameData,
  Game,
  JoinGameData,
  Player,
  RegData,
  StartGameData,
  WSMessage,
} from "../types";
import { randomUUID } from "node:crypto";
import { gamesByCode, gamesById, players } from "../db/db";
import { Server, WebSocket } from "ws";
import { generateCode } from "./generateCode";
import { broadcast } from "./broadcast";
import { sendNextQuestion } from "./sendNextQuestion";
import { endQuestion } from "./endQuestion";

export const BASE_POINTS = 1000;

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
        currentQuestion: -1,
        status: "waiting",
        playerAnswers: new Map(),
      };
      gamesByCode.set(game.code, game);
      gamesById.set(game.id, game);

      response.type = "game_created";
      response.data = {
        gameId: game.id,
        code: game.code,
      };
      break;
    }
    case "join_game": {
      const data = message.data as JoinGameData;
      const game = gamesByCode.get(data.code);
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
      broadcast(game, joinResponse, updateResponse);

      return;
    }
    case "start_game": {
      const data = message.data as StartGameData;
      const game = gamesById.get(data.gameId);
      if (!game) return;
      sendNextQuestion(game);
      return;
    }
    case "answer": {
      const { gameId, answerIndex } = message.data as AnswerData;
      const player = players.get(ws);
      const game = gamesById.get(gameId);
      if (!game || !player || !game.questionStartTime) return;
      if (game.playerAnswers.has(player.index)) return;

      const questionIndex = game.currentQuestion;
      const question = game.questions[questionIndex];
      if (!question) return;

      const timeLimit = question.timeLimitSec * 1000;
      const timestamp = Date.now() - game.questionStartTime;
      const correctIndex = question.correctIndex;

      game.playerAnswers.set(player.index, { answerIndex, timestamp });
      player.hasAnswered = true;
      player.answeredCorrectly = correctIndex === answerIndex;

      if (player.answeredCorrectly && timestamp < timeLimit) {
        player.score += Math.round(BASE_POINTS * (1 - timestamp / timeLimit));
      }

      ws.send(
        JSON.stringify({
          type: "answer_accepted",
          data: { questionIndex },
          id: 0,
        }),
      );

      if (game.playerAnswers.size === game.players.length) {
        clearTimeout(game.questionTimer);
        endQuestion(game, questionIndex);
      }

      return;
    }
    default:
      break;
  }

  ws.send(JSON.stringify(response));
}
