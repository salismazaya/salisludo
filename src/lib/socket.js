import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket && typeof window !== 'undefined') {
    socket = io({
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 200,
      reconnectionDelayMax: 1000,
      timeout: 10000
    });
  }
  return socket;
}
