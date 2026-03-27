import { Game, Player } from '../types.js';

export const games = new Map<string, Game>();

export function saveGame(game: Game): void {
    games.set(game.id, game);
}

export function getGame(id: string): Game | undefined {
    return games.get(id);
}

export function findGameByCode(code: string): Game | undefined {
    for (const game of games.values()) {
        if (game.code === code) {
            return game;
        }
    }
    return undefined;
}

export function deleteGame(id: string): boolean {
    return games.delete(id);
}

export function updateGameStatus(id: string, status: Game['status']): boolean {
    const game = games.get(id);
    if (!game) return false;
    
    game.status = status;
    return true;
}

export function nextQuestion(id: string): boolean {
    const game = games.get(id);
    if (!game) return false;
    
    game.currentQuestion++;
    return true;
}

export function addPlayerToGame(gameId: string, player: Player): boolean {
    const game = games.get(gameId);
    if (!game) return false;
    
    const exists = game.players.some(p => p.index === player.index);
    if (exists) return false;
    
    game.players.push(player);
    return true;
}

export function removePlayerFromGame(gameId: string, playerIndex: string): boolean {
    const game = games.get(gameId);
    if (!game) return false;
    
    const initialLength = game.players.length;
    game.players = game.players.filter(p => p.index !== playerIndex);
    
    return initialLength !== game.players.length;
}

export function getPlayersInGame(gameId: string): Player[] {
    const game = games.get(gameId);
    return game ? [...game.players] : [];
}

export function getPlayerCount(gameId: string): number {
    const game = games.get(gameId);
    return game ? game.players.length : 0;
}

export function removePlayerFromAllGames(playerIndex: string): string[] {
    const affectedGames: string[] = [];
    
    for (const [gameId, game] of games.entries()) {
        const hadPlayer = game.players.some(p => p.index === playerIndex);
        
        if (hadPlayer) {
            game.players = game.players.filter(p => p.index !== playerIndex);
            affectedGames.push(gameId);
            
            if (game.status === 'in_progress' && game.players.length === 0) {
                game.status = 'finished';
            }
        }
    }
    
    return affectedGames;
}

export function getAllGames(): Game[] {
    return Array.from(games.values());
}

export function clearGames(): void {
    games.clear();
}