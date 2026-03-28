import type { ServerContext } from './types.js';

export function createContext(): ServerContext {
  return {
    usersByName: new Map(),
    usersById: new Map(),
    gamesById: new Map(),
    gamesByCode: new Map(),
    wsToUserId: new Map(),
    userIdToGameId: new Map(),
  };
}
