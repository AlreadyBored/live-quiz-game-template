import { WSMessage } from "../types";

export function isMessage(message: any): message is WSMessage {
  if (message && typeof message === "object" && "type" in message && "data" in message && "id" in message) {
    return true;
  }
  return false;
}
