export interface Room {
  id: string;
  name: string;
  movieId: string;
  hostId: string;
  participants: string[];
  currentTime: number;
  isPlaying: boolean;
  createdAt: Date;
}

export interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
}

export interface SyncEvent {
  type: 'play' | 'pause' | 'seek';
  currentTime: number;
  userId: string;
}
