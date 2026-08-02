import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL || window.location.origin, {
      path: '/socket.io',
      autoConnect: false,
      auth: () => ({ token: getAccessToken() }),
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
