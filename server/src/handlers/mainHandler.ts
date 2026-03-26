import { WSMessage } from '../types';
import { WebSocket } from 'ws';
import { regHandler } from './regHandler';
import { createGameHadler } from './createGameHadler';
import { joinGameHadler } from './joinGameHadler';

export const handlerMessage = (ws: WebSocket, message: WSMessage) => {
  const { type, data } = message;
  console.log('type!!!!!!!', type);
  switch (type) {
    case 'reg':
      regHandler(ws, data);
      break;

    case 'create_game':
      createGameHadler(ws, data);
      break;

    case 'join_game':
      joinGameHadler(ws, data);
      break;

    case 'player_joined':
      break;

    case 'update_players':
      break;

    case 'answer_accepted':
      // confirmation from server — we already set hasAnswered optimistically
      break;

    case 'question':
      //   setCurrentQuestion(data as QuestionMessage);
      break;

    case 'question_result':
      //   setQuestionResult(data as QuestionResultMessage);
      break;

    case 'game_finished':
      //   setFinalResults(data as GameFinishedMessage);
      break;

    case 'error':
      break;

    default:
      console.log('Unhandled message type:', type);
  }
};
