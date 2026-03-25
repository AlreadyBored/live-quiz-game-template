import { WebSocketServer } from "ws";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws, request) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log("Received:", message.toString());

    ws.send(
      JSON.stringify({
        type: "reg",
        data: {
          name: "Ksu",
          index: 0,
          error: false,
          errorText: "",
        },
        id: 0,
      }),
    );
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});
