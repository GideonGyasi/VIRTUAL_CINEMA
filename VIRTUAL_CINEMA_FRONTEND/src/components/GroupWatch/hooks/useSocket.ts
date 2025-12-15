import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../utils";
import type{ Participant, ChatMessage, Movie } from "../types";

interface UseSocketProps {
  sessionId: string;
  movie: Movie;
  userId: string;
  userName: string;
  isHost: boolean;
  playerReady: boolean;
  initialSyncApplied: boolean;
  onRoomSync: (data: unknown) => void;
  onMovieUpdate: (movieData: Movie) => void;
  onParticipantsUpdate: (data: Participant[]) => void;
  onChatMessage: (msg: ChatMessage) => void;
  onEmojiReaction: (reactionData: unknown) => void;
  onVideoPlay: (data: { time: number; at: number }) => void;
  onVideoPause: (data: { time: number; at: number }) => void;
  onVideoSeek: (data: { time: number; at: number }) => void;
  onVideoSync: (data: unknown) => void;
  onParticipantJoined: (participant: Participant) => void;
  onDirectSync: (data: unknown) => void;
}

export const useSocket = ({
  sessionId,
  movie,
  userId,
  userName,
  onRoomSync,
  onMovieUpdate,
  onParticipantsUpdate,
  onChatMessage,
  onEmojiReaction,
  onVideoPlay,
  onVideoPause,
  onVideoSeek,
  onVideoSync,
  onParticipantJoined,
  onDirectSync,
}: UseSocketProps) => {
  const socketRef = useRef<Socket | null>(null);


  useEffect(() => {
    const socket = io(SOCKET_URL, { 
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    // Join room
    socket.emit("room:join", {
      sessionId,
      movie,
      user: { id: userId, name: userName }
    });

    // Event listeners
    socket.on("room:sync", onRoomSync);
    socket.on("room:movie:update", onMovieUpdate);
    socket.on("room:participants", onParticipantsUpdate);
    socket.on("room:chat:message", onChatMessage);
    socket.on("room:emoji:reaction", onEmojiReaction);
    socket.on("room:video:play", onVideoPlay);
    socket.on("room:video:pause", onVideoPause);
    socket.on("room:video:seek", onVideoSeek);
    socket.on("room:video:sync", onVideoSync);
    socket.on("room:participant:joined", onParticipantJoined);
    socket.on("room:video:sync:direct", onDirectSync);

    // Connection events
    socket.on("connect_error", console.error);
    socket.on("connect", () => console.log('✅ Socket connected'));
    socket.on("disconnect", () => console.log('❌ Socket disconnected'));

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("room:leave", { sessionId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [sessionId]);

  return socketRef;
};