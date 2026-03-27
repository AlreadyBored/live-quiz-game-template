export const BASE_POINTS = 1000;
export const CODE_LENGTH = 6;

export const GAME_STATUSES = {
    WAITING: 'waiting',
    IN_PROGRESS: 'in_progress',
    FINISHED: 'finished',
} as const;

export type GameStatus = typeof GAME_STATUSES[keyof typeof GAME_STATUSES];

export const INCOMING_MESSAGES = {
    REG: 'reg',
    CREATE_GAME: 'create_game',
    JOIN_GAME: 'join_game',
    START_GAME: 'start_game',
    ANSWER: 'answer',
} as const;

export const OUTGOING_MESSAGES = {
    REG: 'reg',
    GAME_CREATED: 'game_created',
    GAME_JOINED: 'game_joined',
    PLAYER_JOINED: 'player_joined',
    UPDATE_PLAYERS: 'update_players',
    QUESTION: 'question',
    ANSWER_ACCEPTED: 'answer_accepted',
    QUESTION_RESULT: 'question_result',
    GAME_FINISHED: 'game_finished',
} as const;

export type IncomingMessageType = typeof INCOMING_MESSAGES[keyof typeof INCOMING_MESSAGES];
export type OutgoingMessageType = typeof OUTGOING_MESSAGES[keyof typeof OUTGOING_MESSAGES];