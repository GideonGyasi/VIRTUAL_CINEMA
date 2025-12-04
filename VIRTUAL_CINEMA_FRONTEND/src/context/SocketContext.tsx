import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import type { Message, SyncEvent } from '../types/room';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (message: string) => void;
  sendSyncEvent: (event: SyncEvent) => void;
  onMessage: (callback: (message: Message) => void) => void;
  onSyncEvent: (callback: (event: SyncEvent) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:5000', {
      auth: { token },
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  const joinRoom = (roomId: string) => {
    socket?.emit('join-room', roomId);
  };

  const leaveRoom = () => {
    socket?.emit('leave-room');
  };

  const sendMessage = (message: string) => {
    socket?.emit('send-message', message);
  };

  const sendSyncEvent = (event: SyncEvent) => {
    socket?.emit('sync-event', event);
  };

  const onMessage = (callback: (message: Message) => void) => {
    socket?.on('message', callback);
  };

  const onSyncEvent = (callback: (event: SyncEvent) => void) => {
    socket?.on('sync-event', callback);
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendSyncEvent,
    onMessage,
    onSyncEvent,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
