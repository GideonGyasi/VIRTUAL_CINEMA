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
  name?: string;
  emoji: string;
  at?: string;
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

export type RoomSyncData = {
  videoTime: number | string;
  isPlaying: boolean;
  playbackRate: number;
  participants: Participant[];
  messages: ChatMessage[];
  isHost?: boolean;
  hostId?: string;
  joinedAt?: number;
  movie?: Movie;
   controlAccessUsers?: string[];
};

export type VideoSyncData = {
  time: number | string;
  isPlaying: boolean;
  playbackRate?: number;
  at?: number;
  isHost?: boolean;
};

export type MovieUpdateData = Movie;

export type ControlAccessData = {
  participantId: string;
  grantedBy?: string;
  revokedBy?: string;
  at?: number;
};

export type EmojiReactionData = {
  userId: string;
  name?: string;
  emoji: string;
  at?: string;
};