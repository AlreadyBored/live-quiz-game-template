import { registerUser } from "./services/registerUser"
import { WSMessage } from "./types"

export function processMessage(message: WSMessage) {
  const { type } = message

  switch (type) {
    case "reg":
      return registerUser(message)
    default:
      break
  }
}
