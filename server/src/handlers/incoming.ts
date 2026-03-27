import { WebSocket } from 'ws';

import { INCOMING_MESSAGES } from '../utils/consts.js';
import { handleRegister } from './registration.js';


export function handleMessage(ws: WebSocket, message: any): void {
    console.log(`[Handler] Received message type: ${message.type}`);
    
    switch (message.type) {
        case INCOMING_MESSAGES.REG:
            handleRegister(ws, message.data);
            break;
        default:
            console.log(`[Handler] Unknown message type: ${message.type}`);
            ws.send(JSON.stringify({
                type: 'error',
                data: { error: true, errorText: `Unknown message type: ${message.type}` },
                id: 0
            }));
    }
}