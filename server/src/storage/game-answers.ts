export interface PlayerAnswer {
    playerIndex: string;
    answerIndex: number;
    timestamp: number;
}

export const gameAnswers = new Map<string, Map<string, PlayerAnswer>>();
export const activeTimers = new Map<string, NodeJS.Timeout>();
export const questionStartTimes = new Map<string, number>();

export function initGameAnswers(gameId: string): void {
    if (!gameAnswers.has(gameId)) {
        gameAnswers.set(gameId, new Map<string, PlayerAnswer>());
    }
}

export function addPlayerAnswer(
    gameId: string, 
    playerIndex: string, 
    answerIndex: number, 
    timestamp: number
): void {
    initGameAnswers(gameId);
    const answers = gameAnswers.get(gameId)!;
    answers.set(playerIndex, { playerIndex, answerIndex, timestamp });
}

export function getPlayerAnswer(gameId: string, playerIndex: string): PlayerAnswer | undefined {
    const answers = gameAnswers.get(gameId);
    return answers?.get(playerIndex);
}

export function hasPlayerAnswered(gameId: string, playerIndex: string): boolean {
    const answers = gameAnswers.get(gameId);
    return answers?.has(playerIndex) ?? false;
}

export function getAnsweredCount(gameId: string): number {
    const answers = gameAnswers.get(gameId);
    return answers ? answers.size : 0;
}

export function getAnsweredPlayers(gameId: string): PlayerAnswer[] {
    const answers = gameAnswers.get(gameId);
    return answers ? Array.from(answers.values()) : [];
}

export function getAllAnswers(gameId: string): Map<string, PlayerAnswer> | undefined {
    return gameAnswers.get(gameId);
}

export function hasAllPlayersAnswered(gameId: string, totalPlayers: number): boolean {
    const answers = gameAnswers.get(gameId);
    if (!answers) return false;
    if (totalPlayers === 0) return true;
    return answers.size === totalPlayers;
}

export function clearGameAnswers(gameId: string): void {
    gameAnswers.delete(gameId);
}

export function setActiveTimer(gameId: string, timeout: NodeJS.Timeout): void {
    clearActiveTimer(gameId);
    activeTimers.set(gameId, timeout);
}

export function getActiveTimer(gameId: string): NodeJS.Timeout | undefined {
    return activeTimers.get(gameId);
}

export function clearActiveTimer(gameId: string): void {
    const timer = activeTimers.get(gameId);
    if (timer) {
        clearTimeout(timer);
        activeTimers.delete(gameId);
    }
}

export function setQuestionStartTime(gameId: string, startTime: number): void {
    questionStartTimes.set(gameId, startTime);
}

export function getQuestionStartTime(gameId: string): number | undefined {
    return questionStartTimes.get(gameId);
}

export function clearQuestionStartTime(gameId: string): void {
    questionStartTimes.delete(gameId);
}

export function clearAllGameAnswers(): void {
    gameAnswers.clear();
    activeTimers.clear();
    questionStartTimes.clear();
}