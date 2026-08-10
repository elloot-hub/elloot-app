"use client";

import { io, type Socket } from "socket.io-client";
import { config } from "@/lib/config";
import type { ClientToServerEvents, ServerToClientEvents } from "./events";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;
let activeToken: string | null = null;

export function getRealtimeSocket() {
  return socket;
}

export function connectRealtime(token: string): AppSocket {
  if (socket && activeToken === token && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  activeToken = token;
  socket = io(config.apiUrl, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 20,
  });

  return socket;
}

export function disconnectRealtime() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  activeToken = null;
}
