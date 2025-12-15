export type Participant = {
  id: string;
  name: string;
  socketId: string;
  muted: boolean;
  cameraOn: boolean;
  stream?: MediaStream;
  isSpeaking?: boolean;
  isHost?: boolean;
  hasControlAccess?: boolean; // Admin control access for playback
  joinedAt?: number;
  avatar?: string; // Avatar data (JSON string or URL)
};

export type ChatMessage = {
  id: string;
  userId: string;
  name: string;
  text: string;
  at: string;
};

export type Reaction = {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  at: string;
};

export type Movie = {
  id?: string;
  title: string;
  src: string;
  poster?: string;
  type?: string;
  trailer?: string;
  year?: number;
  description?: string;
  rating?: number;
  duration?: number;
};

export interface GroupWatchProps {
  movie: Movie;
  sessionId?: string;
  displayName?: string;
}