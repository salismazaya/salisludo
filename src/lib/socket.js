import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket && typeof window !== 'undefined') {
    socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      timeout: 10000
    });
  }
  return socket;
}
