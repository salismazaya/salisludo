import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket && typeof window !== 'undefined') {
    socket = io();
  }
  return socket;
}
