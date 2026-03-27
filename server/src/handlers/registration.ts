
import { WebSocket } from 'ws';
import { RegData, Player, User } from '../types.js';
import { 
    players, 
    savePlayer, 
    saveUser, 
    getUserByName
} from '../storage.js';
import { OUTGOING_MESSAGES } from '../utils/consts.js';

function generatePlayerIndex(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${random}`;
}

function sendSuccessResponse(ws: WebSocket, name: string, index: string): void {
    const response = {
        type: OUTGOING_MESSAGES.REG,
        data: {
            name: name,
            index: index,
            error: false,
            errorText: ''
        },
        id: 0
    };
    
    ws.send(JSON.stringify(response));
    console.log(`[Registration] Success response sent for ${name}`);
}

function sendErrorResponse(ws: WebSocket, errorText: string): void {
    const response = {
        type: OUTGOING_MESSAGES.REG,
        data: {
            name: '',
            index: '',
            error: true,
            errorText: errorText
        },
        id: 0
    };
    
    ws.send(JSON.stringify(response));
    console.log(`[Registration] Error response sent: ${errorText}`);
}

export function handleRegister(ws: WebSocket, data: RegData): void {
    const { name, password } = data;
    
    console.log(`[Registration] Attempt - Name: ${name}`);

    if (!name || name.trim() === '') {
        sendErrorResponse(ws, 'Name is required');
        return;
    }
    
    if (!password || password.trim() === '') {
        sendErrorResponse(ws, 'Password is required');
        return;
    }

    const trimmedName = name.trim();
    const existingUser = getUserByName(trimmedName);
    
    if (existingUser) {
        if (existingUser.password !== password) {
            sendErrorResponse(ws, 'Invalid password');
            return;
        }
        
        existingUser.ws = ws;
        
        let existingPlayer = players.get(existingUser.index);
        
        if (!existingPlayer) {
            const newPlayer: Player = {
                name: trimmedName,
                index: existingUser.index,
                score: 0,
                ws: ws,
                hasAnswered: false,
                answerTime: undefined,
                answeredCorrectly: false
            };
            savePlayer(newPlayer);
        } else {
            existingPlayer.ws = ws;
        }
        
        sendSuccessResponse(ws, trimmedName, existingUser.index);
        return;
    }

    const playerIndex = generatePlayerIndex();

    const newUser: User = {
        name: trimmedName,
        password: password,
        index: playerIndex,
        ws: ws
    };
    
    saveUser(newUser);

    const newPlayer: Player = {
        name: trimmedName,
        index: playerIndex,
        score: 0,
        ws: ws,
        hasAnswered: false,
        answerTime: undefined,
        answeredCorrectly: false
    };
    
    savePlayer(newPlayer);

    sendSuccessResponse(ws, trimmedName, playerIndex);
}