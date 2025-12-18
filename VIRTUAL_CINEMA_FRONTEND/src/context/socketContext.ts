import { createContext, useContext } from 'react';
import type { Socket } from 'socket.io-client';
import type { Message, SyncEvent } from '../types/room';

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (message: string) => void;
  sendSyncEvent: (event: SyncEvent) => void;
  onMessage: (callback: (message: Message) => void) => void;
  onSyncEvent: (callback: (event: SyncEvent) => void) => void;
}

export const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};


