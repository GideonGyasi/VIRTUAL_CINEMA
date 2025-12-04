import { create } from 'zustand';
import type { Room, Message } from '../types/room';

interface RoomStore {
  currentRoom: Room | null;
  messages: Message[];
  setCurrentRoom: (room: Room | null) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  currentRoom: null,
  messages: [],
  setCurrentRoom: (room) => set({ currentRoom: room }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
}));
