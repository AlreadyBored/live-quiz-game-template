import { Game, User } from '../types';
import { WebSocket } from 'ws';

export const USERS = new Map<string, User>();
export const GAMES = new Map<string, Game>();
export const CODE_TO_GAME = new Map<string, string>();
export const WS_TO_USER = new Map<WebSocket, string>();
