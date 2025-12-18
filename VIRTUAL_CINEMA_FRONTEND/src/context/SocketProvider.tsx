import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { SocketContext } from './socketContext';
import type { SocketContextType } from './socketContext';
import type { Socket } from 'socket.io-client';
import type { Message, SyncEvent } from '../types/room';

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

    // Set state only when the socket actually connects to avoid synchronous setState in the effect body
    const handleConnect = () => {
      setIsConnected(true);
      setSocket(newSocket);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);

    return () => {
      // Cleanup listeners and close socket
      newSocket.off('connect', handleConnect);
      newSocket.off('disconnect', handleDisconnect);
      try { newSocket.close(); } catch (e) { 
        console.log(e); /* ignore */ }
      setSocket(null);
      setIsConnected(false);
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