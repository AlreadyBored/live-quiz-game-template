import { Game } from '../types.js';

export function startTimer(game: Game, callback: (game: Game) => void): void {
    const currentQuestion = game.questions[game.currentQuestion];
    if (!currentQuestion) return;
    
    const timeLimitMs = currentQuestion.timeLimitSec * 1000;
    
    // Сохраняем время начала вопроса
    game.questionStartTime = Date.now();
    
    // Очищаем старый таймер, если есть
    if (game.questionTimer) {
        clearTimeout(game.questionTimer);
    }
    
    // Устанавливаем новый таймер
    game.questionTimer = setTimeout(() => {
        callback(game);
    }, timeLimitMs);
    
    console.log(`[Timer] Started timer for game ${game.id}, question ${game.currentQuestion}, ${currentQuestion.timeLimitSec}s`);
}

export function stopTimer(game: Game): void {
    if (game.questionTimer) {
        clearTimeout(game.questionTimer);
        game.questionTimer = undefined;
        console.log(`[Timer] Stopped timer for game ${game.id}`);
    }
}