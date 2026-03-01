import { io } from 'socket.io-client';

// In development with Vite, API and websockets are on the same port proxied or 3001
const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
});

export const joinEventRoom = (eventId) => {
  if (eventId) {
    socket.emit('join_event', eventId);
  }
};
