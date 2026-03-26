import { WSMessage } from "../types"

export function registerUser(message: WSMessage) {
  const { name } = message.data

  return {
    type: "reg",
    data: {
      name: name,
      index: "<number | string>",
      error: false,
      errorText: "",
    },
    id: 0,
  }
}
