"use client";

import { io, type Socket } from "socket.io-client";
import { config } from "@/lib/config";
import type { ClientToServerEvents, ServerToClientEvents } from "./events";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;
let connectedForSession = false;

export function getRealtimeSocket() {
  return socket;
}

/** Cookie session only — do not pass JWT in handshake auth. */
export function connectRealtime(_sessionFlag?: string): AppSocket {
  if (socket && connectedForSession && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  connectedForSession = true;
  socket = io(config.apiUrl, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    withCredentials: true,
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
  connectedForSession = false;
}
