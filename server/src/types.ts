export interface Player {
  name: string;
  index: string;
  score: number;
}

export interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  timeLimitSec: number;
}

export interface Game {
  id: string;
  code: string;
  hostId: string;
  questions: Question[];
  players: Player[];
  currentQuestion: number;
  status: "waiting" | "in_progress" | "finished";
  questionStartTime: number | null;
  questionTimer: NodeJS.Timeout | null;
  playerAnswers: Map<string, { answerIndex: number; timestamp: number }>;
}

export interface User {
  name: string;
  password: string;
  index: string;
}

export type WSMessage = {
  [K in keyof IncomingMessages]: {
    type: K;
    data: IncomingMessages[K];
    id: number;
  };
}[keyof IncomingMessages];

export interface RegData {
  name: string;
  password: string;
}

export interface RegResponse {
  name: string;
  index: string;
  error: boolean;
  errorText: string;
}

export interface CreateGameData {
  questions: Question[];
}

export interface JoinGameData {
  code: string;
}

export interface StartGameData {
  gameId: string;
}

export interface AnswerData {
  gameId: string;
  questionIndex: number;
  answerIndex: number;
}

export interface IncomingMessages {
  reg: RegData;
  create_game: CreateGameData;
  join_game: JoinGameData;
  start_game: StartGameData;
  answer: AnswerData;
}

export type UpdatePlayersData = Player[];

export interface PlayerJoinedData {
  playerName: string;
  playerCount: number;
}

export interface QuestionData {
  questionNumber: number;
  totalQuestions: number;
  text: string;
  options: string[];
  timeLimitSec: number;
}

export interface PlayerResult {
  name: string;
  answered: boolean;
  correct: boolean;
  pointsEarned: number;
  totalScore: number;
}

export interface QuestionResultData {
  questionIndex: number;
  correctIndex: number;
  playerResults: PlayerResult[];
}

export interface ScoreboardEntry {
  name: string;
  score: number;
  rank: number;
}

export interface GameFinishedData {
  scoreboard: ScoreboardEntry[];
}

export interface BroadcastMessages {
  player_joined: PlayerJoinedData;
  update_players: UpdatePlayersData;
  question: QuestionData;
  question_result: QuestionResultData;
  game_finished: GameFinishedData;
}

export interface GameCreatedData {
  gameId: string;
  code: string;
}

export interface GameJoinedData {
  gameId: string;
}

export interface AnswerAcceptedData {
  questionIndex: number;
}

export interface ErrorData {
  message: string;
}

export interface SendMessages {
  reg: RegResponse;
  game_created: GameCreatedData;
  game_joined: GameJoinedData;
  answer_accepted: AnswerAcceptedData;
  error: ErrorData;
}
