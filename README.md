# WebSocket Live Quiz Game


## Project structure

```
├── client/          # Frontend (React + Vite) — fully working, do not modify
├── server/          # Backend (Node.js + ws) — YOUR implementation goes here
│   ├── src/
│   │   ├── index.ts   # Server entry point (starter code provided)
│   │   └── types.ts   # TypeScript interfaces for all data structures
│   ├── package.json
│   └── tsconfig.json
└── package.json     # Root workspace config
```

## Getting started

```bash
# Install all dependencies (server + client)
npm install

# Run both server and client in dev mode
npm run dev

# Or run them separately:
npm run start:server   # server only (ws://localhost:3000)
npm run start:client   # client only (http://localhost:5173)
```


**Client → Server commands:**
- `reg` — register or login a player
- `create_game` — host creates a game with questions
- `join_game` — player joins a game by room code
- `start_game` — host starts the game
- `answer` — player submits an answer

**Server → Client responses:**
- `reg` — registration result
- `game_created` — game created with gameId and room code
- `game_joined` — join confirmation
- `player_joined` — broadcast when a player joins
- `update_players` — broadcast updated player list
- `question` — broadcast a question (without correct answer!)
- `answer_accepted` — answer submission confirmed
- `question_result` — broadcast results after a question ends
- `game_finished` — broadcast final scoreboard
- `error` — error message

Refer to the full assignment specification for detailed data structures and the expected game flow.

## How to test

1. Start the server: `npm run start:server`
2. Start the client: `npm run start:client`
3. Open `http://localhost:5173` in two browser tabs
4. In one tab — register and create a game (host)
5. In the other tab — register and join the game using the room code
6. Host starts the game, player answers questions
7. Verify scores, results, and final scoreboard

## Build for production

```bash
# Build server
cd server && npm run build

# Start built server
npm run start
```
