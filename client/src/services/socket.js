import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  const token = localStorage.getItem('connext_token');

  if (!socket || socket.disconnected) {
    socket = io('/', {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });
  }

  // Update token on handshake if changed
  if (token && socket.auth) {
    socket.auth.token = token;
  }

  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (s.disconnected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
