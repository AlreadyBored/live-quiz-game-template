import { WebSocketServer } from "ws"
import { processMessage } from "./controller"
import { WSMessage } from "./types"

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 7001

// WebSocket server
const wss = new WebSocketServer({ port: PORT })

wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(rawMessage) {
    try {
      const message = JSON.parse(
        rawMessage.toString("utf8")
      ) as unknown as WSMessage

      const response = processMessage(ws, message)

      ws.send(JSON.stringify(response))
    } catch (err) {
      console.log(err)
      ws.send(
        JSON.stringify({ type: "error", message: "An error has ocurred" })
      )
    }
  })
})
