import { WebSocketServer } from "ws";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });
const address = wss.address();
if (address && typeof address === "object") {
  console.log(
    `Started WebSocket server on address: ${address.address}, port: ${address.port}`,
  );
}

wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    console.log("received: %s", data);
  });
});
