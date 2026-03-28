import { WebSocket } from 'ws';
import type { WebSocketServer } from 'ws';

export interface ServerInstance {
  wss: WebSocketServer;
  cleanup: () => Promise<void>;
}

export async function startServer(port: number): Promise<ServerInstance> {
  const mod = await import('../src/index.js');
  const wss = mod.createServer(port);
  return {
    wss,
    cleanup: () => stopServer(wss),
  };
}

export function stopServer(wss: WebSocketServer): Promise<void> {
  return new Promise((resolve) => {
    for (const client of wss.clients) {
      client.terminate();
    }
    wss.close(() => resolve());
  });
}

export function createClient(port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

export function send(ws: WebSocket, type: string, data: any): void {
  ws.send(JSON.stringify({ type, data, id: 0 }));
}

export function waitForMessage(
  ws: WebSocket,
  expectedType: string,
  timeout = 5000,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.removeListener('message', handler);
      reject(new Error(`Timeout waiting for message type "${expectedType}"`));
    }, timeout);

    const handler = (raw: Buffer | string) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === expectedType) {
        clearTimeout(timer);
        ws.removeListener('message', handler);
        resolve(msg);
      }
    };
    ws.on('message', handler);
  });
}

export async function sendAndWait(
  ws: WebSocket,
  type: string,
  data: any,
  expectedType: string,
  timeout = 5000,
): Promise<any> {
  const promise = waitForMessage(ws, expectedType, timeout);
  send(ws, type, data);
  return promise;
}

export async function registerUser(
  ws: WebSocket,
  name: string,
  password: string,
): Promise<any> {
  return sendAndWait(ws, 'reg', { name, password }, 'reg');
}

export function collectMessages(
  ws: WebSocket,
  count: number,
  timeout = 5000,
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const messages: any[] = [];
    const timer = setTimeout(() => {
      ws.removeListener('message', handler);
      reject(
        new Error(`Timeout: collected ${messages.length}/${count} messages`),
      );
    }, timeout);

    const handler = (raw: Buffer | string) => {
      messages.push(JSON.parse(raw.toString()));
      if (messages.length === count) {
        clearTimeout(timer);
        ws.removeListener('message', handler);
        resolve(messages);
      }
    };
    ws.on('message', handler);
  });
}

export function closeClient(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    if (ws.readyState === WebSocket.CLOSED) {
      resolve();
      return;
    }
    ws.on('close', () => resolve());
    ws.close();
  });
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
