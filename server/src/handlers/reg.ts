import type { WebSocket } from "ws";
import type { RegData, RegResponse } from "../types.js";
import { send } from "../utils/index.js";
import {
  usersById,
  userIdByName,
  socketsByUserId,
  userIdBySocket,
  generateUserId,
} from "../store.js";

export const handleReg = (ws: WebSocket, data: RegData): void => {
  const { name, password } = data;

  const existingUserId = userIdByName.get(name);

  if (existingUserId) {
    const existingUser = usersById.get(existingUserId)!;

    if (existingUser.password !== password) {
      const res: RegResponse = {
        name,
        index: "",
        error: true,
        errorText: "Wrong password",
      };

      send(ws, "reg", res);
      return;
    }

    const oldSocket = socketsByUserId.get(existingUserId);

    if (oldSocket && oldSocket !== ws) {
      userIdBySocket.delete(oldSocket);
    }

    socketsByUserId.set(existingUserId, ws);
    userIdBySocket.set(ws, existingUserId);

    const res: RegResponse = {
      name,
      index: existingUser.index,
      error: false,
      errorText: "",
    };

    send(ws, "reg", res);
  } else {
    const userId = generateUserId();
    const user = { name, password, index: userId };

    usersById.set(userId, user);
    userIdByName.set(name, userId);
    socketsByUserId.set(userId, ws);
    userIdBySocket.set(ws, userId);

    const res: RegResponse = {
      name,
      index: userId,
      error: false,
      errorText: "",
    };

    send(ws, "reg", res);
  }
};
