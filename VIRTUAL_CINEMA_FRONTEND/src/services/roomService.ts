import api from './api';
import type { Room } from '../types/room';

export const roomService = {
  async createRoom(movieId: string, name: string): Promise<Room> {
    const response = await api.post('/rooms', { movieId, name });
    return response.data;
  },

  async joinRoom(roomId: string): Promise<Room> {
    const response = await api.post(`/rooms/${roomId}/join`);
    return response.data;
  },

  async sendSyncEvent(roomId: string, event: { type: 'play' | 'pause' | 'seek'; currentTime: number }): Promise<void> {
    await api.post(`/rooms/${roomId}/sync`, event);
  },
};
