import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const fromEnv = (import.meta as any)?.env?.VITE_API_BASE as string | undefined;
const fromLocation =
  typeof window !== 'undefined'
    ? window.location.origin.replace(':5173', ':8080')
    : 'http://localhost:8080';

const SOCKET_BASE = fromEnv || fromLocation;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_BASE, { withCredentials: true });
  }
  return socket;
};
