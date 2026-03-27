import { WebSocket } from 'ws';
import { User, Game, Player } from './types';

export const users = new Map<string, User>();  
export const players = new Map<string, Player>();        
export const games = new Map<string, Game>();       
export const sessions = new Map<WebSocket, string>();

export function saveUser(user: User): void {
    users.set(user.index, user);
    console.log(`[Storage] User saved: ${user.name} (${user.index})`);
}

export function getUserByIndex(index: string): User | undefined {
    return users.get(index);
}

export function getUserByName(name: string): User | undefined {
    for (const user of users.values()) {
        if (user.name === name) {
            return user;
        }
    }
    return undefined;
}

export function isUserNameExists(name: string): boolean {
    return getUserByName(name) !== undefined;
}

export function setUserWebSocket(index: string, ws: WebSocket): void {
    const user = users.get(index);
    if (user) {
        user.ws = ws;
        sessions.set(ws, index);
        console.log(`[Storage] WebSocket set for user: ${user.name}`);
    }
}

export function deleteUserWebSocket(ws: WebSocket): void {
    const index = sessions.get(ws);
    if (index) {
        const user = users.get(index);
        if (user) {
            user.ws = undefined;
        }
        sessions.delete(ws);
        console.log(`[Storage] WebSocket removed for user: ${index}`);
    }
}


export function saveGame(game: Game): void {
    games.set(game.id, game);
    console.log(`[Storage] Game saved: ${game.id} (code: ${game.code})`);
}

export function getGame(gameId: string): Game | undefined {
    return games.get(gameId);
}

export function findGameByCode(code: string): Game | undefined {
    for (const game of games.values()) {
        if (game.code === code) {
            return game;
        }
    }
    return undefined;
}

export function addPlayerToGame(gameId: string, player: Player): boolean {
    const game = games.get(gameId);
    if (!game) return false;

    if (game.players.some(p => p.index === player.index)) {
        return false;
    }

    game.players.push(player);
    console.log(`[Storage] Player ${player.name} added to game ${gameId}`);
    return true;
}

export function removePlayerFromGame(gameId: string, playerIndex: string): boolean {
    const game = games.get(gameId);
    if (!game) return false;

    const initialLength = game.players.length;
    game.players = game.players.filter(p => p.index !== playerIndex);

    if (initialLength !== game.players.length) {
        console.log(`[Storage] Player ${playerIndex} removed from game ${gameId}`);
        return true;
    }

    return false;
}

export function getPlayersInGame(gameId: string): Player[] {
    const game = games.get(gameId);
    return game ? [...game.players] : [];
}

export function removePlayerFromAllGames(playerIndex: string): string[] {
    const affectedGames: string[] = [];

    for (const [gameId, game] of games.entries()) {
        const hadPlayer = game.players.some(p => p.index === playerIndex);

        if (hadPlayer) {
            game.players = game.players.filter(p => p.index !== playerIndex);
            affectedGames.push(gameId);
            console.log(`[Storage] Player ${playerIndex} removed from game ${gameId}`);

            if (game.status === 'in_progress' && game.players.length === 0) {
                game.status = 'finished';
                console.log(`[Storage] Game ${gameId} finished (no players left)`);
            }
        }
    }

    return affectedGames;
}

export function deleteSession(ws: WebSocket): void {
    const index = sessions.get(ws);
    if (index) {
        const user = users.get(index);
        if (user) {
            user.ws = undefined;
        }
        sessions.delete(ws);
        console.log(`[Storage] Session deleted: ${index}`);
    }
}