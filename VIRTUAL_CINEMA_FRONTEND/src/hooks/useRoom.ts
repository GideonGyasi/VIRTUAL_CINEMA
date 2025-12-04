import { useEffect, useState } from 'react';
import { useRoomStore } from '../store/roomStore';
import { roomService } from '../services/roomService';
import type {  SyncEvent } from '../types/room';

export const useRoom = (roomId: string | null) => {
  const { currentRoom, messages, setCurrentRoom} = useRoomStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const joinRoom = async () => {
      try {
        const room = await roomService.joinRoom(roomId);
        setCurrentRoom(room);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to join room:', error);
      }
    };

    joinRoom();

    return () => {
      setIsConnected(false);
    };
  }, [roomId]);

  const sendMessage = (content: string) => {
    // This would be handled by socket context
    console.log('Sending message:', content);
  };

  const sendSyncEvent = async (event: SyncEvent) => {
    if (!roomId) return;
    try {
      await roomService.sendSyncEvent(roomId, event);
    } catch (error) {
      console.error('Failed to send sync event:', error);
    }
  };

  return {
    room: currentRoom,
    messages,
    isConnected,
    sendMessage,
    sendSyncEvent,
  };
};
