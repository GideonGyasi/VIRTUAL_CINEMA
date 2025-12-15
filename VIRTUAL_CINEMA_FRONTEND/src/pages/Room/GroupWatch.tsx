import React, { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { motion } from "framer-motion";
import Header from "../../components/GroupWatch/Header";
import CameraPanel from "../../components/GroupWatch/CameraPanel";
import PlayerArea from "../../components/GroupWatch/PlayerArea";
import ChatPanel from "../../components/GroupWatch/ChatPanel";
import ParticipantsPanel from "../../components/GroupWatch/ParticipantsPanel";
import VideoStream from "../../components/GroupWatch/VideoStream";
import ControlBar from "../../components/GroupWatch/ControlBar";
import HostControlPanel from "../../components/GroupWatch/HostControlPanel";
import { useSocket } from "../../components/GroupWatch/hooks/useSocket";
import { useSync } from "../../components/GroupWatch/hooks/useSync";
import { useMediaStream } from "../../components/GroupWatch/hooks/useMediaStream";

import { makeId, EMOJI_REACTIONS } from "../../components/GroupWatch/utils";
import type{ GroupWatchProps, Participant, ChatMessage, Reaction, Movie } from "../../components/GroupWatch/types";
import { fetchMoviesWithVideos } from "../../services/movieApi";
import { X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import AuthModal from "../../components/AuthModal";

const GroupWatch: React.FC<GroupWatchProps> = ({ 
  movie: propMovie, 
  sessionId: initialSessionId, 
  displayName 
}) => {
  // State
  const [sessionId] = useState(() => initialSessionId || makeId(10));
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [messageText, setMessageText] = useState("");
  const [copied, setCopied] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showCameraPanel, setShowCameraPanel] = useState(true);
  const [cameraPanelWidth, setCameraPanelWidth] = useState(320);
  const [isHost, setIsHost] = useState(!initialSessionId);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMovie, setCurrentMovie] = useState<Movie>(propMovie);
  const [userInteracted, setUserInteracted] = useState(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [initialSyncApplied, setInitialSyncApplied] = useState(false);
  const [controlAccessUsers, setControlAccessUsers] = useState<Set<string>>(new Set()); // Users with control access (host always has it)
  const [showMovieSelector, setShowMovieSelector] = useState(false);
  const [availableMovies, setAvailableMovies] = useState<Movie[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [coHostIds, setCoHostIds] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [currentLayout, setCurrentLayout] = useState('cinema');
  const [showHostControls, setShowHostControls] = useState(false);
  const [removedByHost, setRemovedByHost] = useState(false);
  const [removedMessage, setRemovedMessage] = useState<string | null>(null);

  // Refs
  const playerRef = useRef<ReactPlayer>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const isApplyingRemote = useRef(false);
  const lastLocalAction = useRef(0);
  const pendingSyncData = useRef<any>(null);
  const isWaitingForInteraction = useRef(false);
  const isProcessingLocalPlayPause = useRef(false);

  // Auth hook
  const { user, isAuthenticated, logout, updateUser } = useAuth();

  // User info - prioritize displayName prop (which is set from GroupWatchPage)
  // This ensures we use the name entered by the user or their authenticated name
  const guestId = useRef(`guest_${Math.random().toString(36).slice(2, 9)}`);
  const localUser = useRef({ 
    id: isAuthenticated && user?.id ? user.id : guestId.current, 
    name: displayName || (isAuthenticated && user?.name ? user.name : `Guest_${makeId(4)}`)
  });

  // Update localUser name when displayName changes (from GroupWatchPage)
  useEffect(() => {
    if (displayName) {
      localUser.current.name = displayName;
    } else if (isAuthenticated && user?.name) {
      localUser.current.name = user.name;
    }
    // If we have a socket, tell the server about our chosen display name so all participants see it
    try {
      if (displayName && socketRef?.current) {
        socketRef.current.emit('room:participant:update', { sessionId, name: displayName });
      }
    } catch (e) {
      console.warn('Failed to emit participant:update for displayName', e);
    }
  }, [displayName, isAuthenticated, user]);

  // Custom hooks
  const mediaStream = useMediaStream();
  const socketRef = useSocket({
    sessionId,
    movie: propMovie,
    userId: localUser.current.id,
    userName: localUser.current.name,
    isHost,
    playerReady,
    initialSyncApplied,
    onRoomSync: handleRoomSync,
    onMovieUpdate: handleMovieUpdate,
    onParticipantsUpdate: setParticipants,
    onChatMessage: handleChatMessage,
    onEmojiReaction: handleEmojiReaction,
    onVideoPlay: handleRemotePlay,
    onVideoPause: handleRemotePause,
    onVideoSeek: handleRemoteSeek,
    onVideoSync: handleRemoteSync,
    onParticipantJoined: handleParticipantJoined,
    onDirectSync: handleDirectSync,
  });

  const { sendPlay, sendPause, sendSeek, sendSync } = useSync({
    isHost,
    sessionId,
    playbackRate,
    playerReady,
    socketRef,
    playerRef,
    isApplyingRemote,
  });

  // Handlers
  function handleRoomSync(data: any) {
    console.log('[🔄 ROOM SYNC] Received room sync data', {
      isHost: data.isHost,
      participantCount: data.participants?.length,
      controlAccessUsers: data.controlAccessUsers,
    });
    
    setIsHost(data.isHost || false);
    
    // Sync control access users from server if provided
    if (data.controlAccessUsers && Array.isArray(data.controlAccessUsers)) {
      setControlAccessUsers(new Set(data.controlAccessUsers));
      console.log('[🔄 ROOM SYNC] Synced control access users', { users: data.controlAccessUsers });
    }
    
    // Update participants with control access info
    const participantsWithControl = (data.participants || []).map((p: Participant) => ({
      ...p,
      hasControlAccess: p.isHost || (data.controlAccessUsers || []).includes(p.id),
    }));
    
    setParticipants(participantsWithControl);
    setMessages(data.messages || []);
    pendingSyncData.current = data;
    
    if (playerReady && !initialSyncApplied) {
      applyInitialSync(data);
    }
  }

  function handleMovieUpdate(movieData: Movie) {
    console.log('[🎬 MOVIE UPDATE] Received movie update', {
      currentMovieId: currentMovie.id,
      newMovieId: movieData.id,
      currentSrc: currentMovie.src,
      newSrc: movieData.src,
    });

    // If it's the same movie, just update properties
    if (movieData.src === currentMovie.src || movieData.id === currentMovie.id) {
      console.log('[🎬 MOVIE UPDATE] Same movie, updating properties');
      setCurrentMovie(prev => ({ ...prev, ...movieData }));
      return;
    }
    
    // Different movie - update and reset player
    console.log('[🎬 MOVIE UPDATE] Different movie detected, switching...');
    setCurrentMovie(movieData);
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      setIsPlaying(false);
    }
    // Force player to reload with new source
    setPlayerReady(false);
    setTimeout(() => {
      setPlayerReady(true);
    }, 100);
  }

  function handleChatMessage(msg: ChatMessage) {
    setMessages(prev => [...prev, msg]);
  }

  function handleEmojiReaction(reactionData: any) {
    const reaction: Reaction = {
      ...reactionData,
      id: `${reactionData.userId}-${Date.now()}`
    };
    setReactions(prev => [...prev, reaction]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);
  }

  function handleRemotePlay({ time, at }: { time: number; at: number }) {
    console.log('[🌐 REMOTE PLAY] handleRemotePlay called', {
      isHost,
      time,
      at,
      isApplyingRemote: isApplyingRemote.current,
      isProcessingLocal: isProcessingLocalPlayPause.current,
      timeSinceLastLocal: Date.now() - lastLocalAction.current,
      playerReady,
    });
    
    if (isApplyingRemote.current || isProcessingLocalPlayPause.current || Date.now() - lastLocalAction.current < 500) {
      console.log('[🌐 REMOTE PLAY] ⚠️ BLOCKED - early return');
      return;
    }
    
    console.log('[🌐 REMOTE PLAY] ✅ PROCEEDING - applying remote play');
    isApplyingRemote.current = true;
    
    if (playerRef.current && playerReady) {
      const player = playerRef.current;
      const timeNumber = typeof time === 'string' ? parseFloat(time) : time;
      const currentTime = player.getCurrentTime();
      
      console.log('[🌐 REMOTE PLAY] Time sync', {
        remoteTime: timeNumber,
        localTime: currentTime,
        diff: Math.abs(currentTime - timeNumber),
      });
      
      if (Math.abs(currentTime - timeNumber) > 0.3) {
        console.log('[🌐 REMOTE PLAY] 🔄 Seeking to remote time');
        player.seekTo(timeNumber, 'seconds');
      }
      
      console.log('[🌐 REMOTE PLAY] ▶️ Setting isPlaying=true and calling handleAutoPlay');
      setIsPlaying(true);
      handleAutoPlay(player);
    } else {
      console.log('[🌐 REMOTE PLAY] ⚠️ Player not ready');
      isApplyingRemote.current = false;
    }
  }

  function handleRemotePause({ time, at }: { time: number; at: number }) {
    console.log('[🌐 REMOTE PAUSE] handleRemotePause called', {
      isHost,
      time,
      at,
      isApplyingRemote: isApplyingRemote.current,
      isProcessingLocal: isProcessingLocalPlayPause.current,
      timeSinceLastLocal: Date.now() - lastLocalAction.current,
      playerReady,
    });
    
    if (isApplyingRemote.current || isProcessingLocalPlayPause.current || Date.now() - lastLocalAction.current < 500) {
      console.log('[🌐 REMOTE PAUSE] ⚠️ BLOCKED - early return');
      return;
    }
    
    console.log('[🌐 REMOTE PAUSE] ✅ PROCEEDING - applying remote pause');
    isApplyingRemote.current = true;
    
    if (playerRef.current && playerReady) {
      const player = playerRef.current;
      const timeNumber = typeof time === 'string' ? parseFloat(time) : time;
      const currentTime = player.getCurrentTime();
      
      console.log('[🌐 REMOTE PAUSE] Time sync', {
        remoteTime: timeNumber,
        localTime: currentTime,
        diff: Math.abs(currentTime - timeNumber),
      });
      
      if (Math.abs(currentTime - timeNumber) > 0.3) {
        console.log('[🌐 REMOTE PAUSE] 🔄 Seeking to remote time');
        player.seekTo(timeNumber, 'seconds');
      }
      
      console.log('[🌐 REMOTE PAUSE] ⏸️ Setting isPlaying=false and pausing player');
      setIsPlaying(false);
      player.getInternalPlayer().pause();
      setShowPlayOverlay(false);
      isWaitingForInteraction.current = false;
      setTimeout(() => {
        isApplyingRemote.current = false;
        console.log('[🌐 REMOTE PAUSE] 🔓 Released remote lock');
      }, 100);
    } else {
      console.log('[🌐 REMOTE PAUSE] ⚠️ Player not ready');
      isApplyingRemote.current = false;
    }
  }

  function handleRemoteSeek({ time, at }: { time: number; at: number }) {
    if (isApplyingRemote.current || Date.now() - lastLocalAction.current < 500) return;
    
    isApplyingRemote.current = true;
    
    if (playerRef.current && playerReady) {
      const timeNumber = typeof time === 'string' ? parseFloat(time) : time;
      playerRef.current.seekTo(timeNumber, 'seconds');
      
      if (isPlaying && userInteracted) {
        setTimeout(() => {
          const internalPlayer = playerRef.current?.getInternalPlayer();
          if (internalPlayer && internalPlayer.paused) {
            internalPlayer.play().catch(console.error);
          }
        }, 100);
      }
      setTimeout(() => isApplyingRemote.current = false, 100);
    }
  }

  function handleRemoteSync(data: any) {
    console.log('[🔄 REMOTE SYNC] handleRemoteSync called', {
      isHost,
      data,
      isApplyingRemote: isApplyingRemote.current,
      isProcessingLocal: isProcessingLocalPlayPause.current,
      timeSinceLastLocal: Date.now() - lastLocalAction.current,
      currentIsPlaying: isPlaying,
      playerReady,
    });
    
    if (isHost || isApplyingRemote.current || isProcessingLocalPlayPause.current || Date.now() - lastLocalAction.current < 800) {
      console.log('[🔄 REMOTE SYNC] ⚠️ BLOCKED - early return');
      return;
    }
    
    console.log('[🔄 REMOTE SYNC] ✅ PROCEEDING - applying sync');
    isApplyingRemote.current = true;
    
    if (playerRef.current && playerReady) {
      const player = playerRef.current;
      const serverTime = typeof data.time === 'string' ? parseFloat(data.time) : data.time;
      const currentTime = player.getCurrentTime();
      const timeDiff = Math.abs(currentTime - serverTime);
      
      console.log('[🔄 REMOTE SYNC] Time check', {
        serverTime,
        currentTime,
        timeDiff,
        needsSeek: timeDiff > 1,
      });
      
      if (timeDiff > 1) {
        console.log('[🔄 REMOTE SYNC] 🔄 Seeking to server time');
        player.seekTo(serverTime, 'seconds');
      }
      
      console.log('[🔄 REMOTE SYNC] Play state check', {
        remoteIsPlaying: data.isPlaying,
        localIsPlaying: isPlaying,
        stateChanged: data.isPlaying !== isPlaying,
      });
      
      if (data.isPlaying !== isPlaying) {
        console.log('[🔄 REMOTE SYNC] 📝 Updating play state', { newState: data.isPlaying });
        setIsPlaying(data.isPlaying);
        if (data.isPlaying) {
          console.log('[🔄 REMOTE SYNC] ▶️ Calling handleAutoPlay');
          handleAutoPlay(player);
        } else {
          console.log('[🔄 REMOTE SYNC] ⏸️ Pausing player');
          player.getInternalPlayer().pause();
          setShowPlayOverlay(false);
          isWaitingForInteraction.current = false;
        }
      }
      
      if (data.playbackRate && data.playbackRate !== playbackRate) {
        console.log('[🔄 REMOTE SYNC] ⚡ Updating playback rate', {
          oldRate: playbackRate,
          newRate: data.playbackRate,
        });
        setPlaybackRate(data.playbackRate);
        player.setPlaybackRate(data.playbackRate);
      }
      
      setTimeout(() => {
        isApplyingRemote.current = false;
        console.log('[🔄 REMOTE SYNC] 🔓 Released remote lock');
      }, 200);
    } else {
      console.log('[🔄 REMOTE SYNC] ⚠️ Player not ready');
      isApplyingRemote.current = false;
    }
  }

  function handleParticipantJoined(participant: Participant) {
    if (isHost && playerRef.current && socketRef.current && playerReady) {
      const currentTime = playerRef.current.getCurrentTime();
      const player = playerRef.current.getInternalPlayer();
      const isPlaying = player && !player.paused;
      
      socketRef.current.emit('room:video:sync:direct', {
        sessionId,
        targetSocketId: participant.socketId,
        time: currentTime,
        isPlaying,
        playbackRate,
        at: Date.now()
      });
    }
  }

  function handleDirectSync(data: any) {
    if (!isHost && playerRef.current && playerReady) {
      applySyncData(data);
    }
  }

  function handleAutoPlay(player: ReactPlayer) {
    console.log('[🎬 AUTO PLAY] handleAutoPlay called', {
      userInteracted,
      showPlayOverlay,
      isWaitingForInteraction: isWaitingForInteraction.current,
    });
    
    setTimeout(() => {
      if (userInteracted) {
        const internalPlayer = player.getInternalPlayer();
        console.log('[🎬 AUTO PLAY] User has interacted, checking player state', {
          hasInternalPlayer: !!internalPlayer,
          isPaused: internalPlayer?.paused,
        });
        
        if (internalPlayer && internalPlayer.paused) {
          console.log('[🎬 AUTO PLAY] ▶️ Attempting to play');
          internalPlayer.play()
            .then(() => console.log('[🎬 AUTO PLAY] ✅ Play succeeded'))
            .catch((error: any) => {
              console.log('[🎬 AUTO PLAY] ❌ Play failed', { error: error.name, message: error.message });
              if (error.name === 'NotAllowedError') {
                console.log('[🎬 AUTO PLAY] ⚠️ User interaction required - showing overlay');
                isWaitingForInteraction.current = true;
                setShowPlayOverlay(true);
              }
            });
        } else {
          console.log('[🎬 AUTO PLAY] ⚠️ Player already playing or not available');
        }
      } else {
        console.log('[🎬 AUTO PLAY] ⏳ User not interacted - showing overlay');
        isWaitingForInteraction.current = true;
        setShowPlayOverlay(true);
      }
      isApplyingRemote.current = false;
      console.log('[🎬 AUTO PLAY] 🔓 Released remote lock');
    }, 200);
  }

  function applyInitialSync(data: any) {
    if (!playerRef.current || !playerReady) return;
    
    isApplyingRemote.current = true;
    const player = playerRef.current;
    const serverTime = typeof data.videoTime === 'string' ? parseFloat(data.videoTime) : data.videoTime;
    
    player.seekTo(serverTime, 'seconds');
    setIsPlaying(data.isPlaying);
    
    if (data.playbackRate && data.playbackRate !== playbackRate) {
      setPlaybackRate(data.playbackRate);
      player.setPlaybackRate(data.playbackRate);
    }
    
    setInitialSyncApplied(true);
    
    if (data.isPlaying && !data.isHost) {
      setTimeout(() => {
        if (userInteracted) {
          const internalPlayer = player.getInternalPlayer();
          if (internalPlayer && internalPlayer.paused) {
            internalPlayer.play().catch((error: any) => {
              if (error.name === 'NotAllowedError') {
                isWaitingForInteraction.current = true;
                setShowPlayOverlay(true);
              }
            });
          }
        } else {
          isWaitingForInteraction.current = true;
          setShowPlayOverlay(true);
        }
        isApplyingRemote.current = false;
      }, 800);
    } else {
      isApplyingRemote.current = false;
    }
  }

  function applySyncData(data: any) {
    if (!playerRef.current || !playerReady) return;
    
    isApplyingRemote.current = true;
    const player = playerRef.current;
    const serverTime = typeof data.time === 'string' ? parseFloat(data.time) : data.time;
    
    player.seekTo(serverTime, 'seconds');
    setIsPlaying(data.isPlaying);
    
    if (data.playbackRate && data.playbackRate !== playbackRate) {
      setPlaybackRate(data.playbackRate);
      player.setPlaybackRate(data.playbackRate);
    }
    
    if (data.isPlaying && !isHost) {
      setTimeout(() => {
        if (userInteracted) {
          const internalPlayer = player.getInternalPlayer();
          if (internalPlayer && internalPlayer.paused) {
            internalPlayer.play().catch((error: any) => {
              if (error.name === 'NotAllowedError') {
                isWaitingForInteraction.current = true;
                setShowPlayOverlay(true);
              }
            });
          }
        } else {
          isWaitingForInteraction.current = true;
          setShowPlayOverlay(true);
        }
        isApplyingRemote.current = false;
      }, 300);
    } else {
      isApplyingRemote.current = false;
    }
  }

  function handlePlayerReady() {
    setPlayerReady(true);
    if (pendingSyncData.current && !initialSyncApplied) {
      applyInitialSync(pendingSyncData.current);
    }
  }

  // Helper function to check if user has control access
  function hasControlAccess(): boolean {
    const hasAccess = isHost || controlAccessUsers.has(localUser.current.id);
    console.log('[🔐 CONTROL] Checking access', {
      userId: localUser.current.id,
      isHost,
      hasControlAccess: controlAccessUsers.has(localUser.current.id),
      result: hasAccess,
      allControlUsers: Array.from(controlAccessUsers),
    });
    return hasAccess;
  }

  function handlePlay() {
    console.log('[🔵 PLAY] handlePlay called', {
      userId: localUser.current.id,
      isHost,
      isApplyingRemote: isApplyingRemote.current,
      isProcessingLocal: isProcessingLocalPlayPause.current,
      hasSocket: !!socketRef.current,
      currentIsPlaying: isPlaying,
    });
    
    // Check control access - only host or users with granted access can play
    if (!hasControlAccess()) {
      console.log('[🔵 PLAY] 🚫 BLOCKED - No control access. Only host or users with granted access can control playback.');
      return;
    }
    
    // Prevent execution if we're applying remote changes or already processing
    if (isApplyingRemote.current || isProcessingLocalPlayPause.current || !socketRef.current) {
      console.log('[🔵 PLAY] ⚠️ BLOCKED - early return');
      return;
    }
    
    // Check actual player state to prevent unnecessary updates
    const internalPlayer = playerRef.current?.getInternalPlayer();
    const playerIsPlaying = internalPlayer && !internalPlayer.paused;
    
    // If state already matches, don't do anything
    if (isPlaying && playerIsPlaying) {
      console.log('[🔵 PLAY] ⚠️ SKIPPED - state already matches');
      return;
    }
    
    console.log('[🔵 PLAY] ✅ PROCEEDING - setting play state (user has control access)');
    isProcessingLocalPlayPause.current = true;
    lastLocalAction.current = Date.now();
    setIsPlaying(true);
    setUserInteracted(true);
    setShowPlayOverlay(false);
    isWaitingForInteraction.current = false;
    
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    console.log('[🔵 PLAY] 📤 Sending play event', { time: currentTime, isHost, userId: localUser.current.id });
    sendPlay(currentTime);
    
    // Reset the flag after a short delay to allow state to stabilize
    setTimeout(() => {
      isProcessingLocalPlayPause.current = false;
      console.log('[🔵 PLAY] 🔓 Released processing lock');
    }, 300);
  }

  function handlePause() {
    console.log('[⏸️ PAUSE] handlePause called', {
      userId: localUser.current.id,
      isHost,
      isApplyingRemote: isApplyingRemote.current,
      isProcessingLocal: isProcessingLocalPlayPause.current,
      hasSocket: !!socketRef.current,
      currentIsPlaying: isPlaying,
    });
    
    // Check control access - only host or users with granted access can pause
    if (!hasControlAccess()) {
      console.log('[⏸️ PAUSE] 🚫 BLOCKED - No control access. Only host or users with granted access can control playback.');
      return;
    }
    
    // Prevent execution if we're applying remote changes or already processing
    if (isApplyingRemote.current || isProcessingLocalPlayPause.current || !socketRef.current) {
      console.log('[⏸️ PAUSE] ⚠️ BLOCKED - early return');
      return;
    }
    
    // Check actual player state to prevent unnecessary updates
    const internalPlayer = playerRef.current?.getInternalPlayer();
    const playerIsPlaying = internalPlayer && !internalPlayer.paused;
    
    // If state already matches, don't do anything
    if (!isPlaying && !playerIsPlaying) {
      console.log('[⏸️ PAUSE] ⚠️ SKIPPED - state already matches');
      return;
    }
    
    console.log('[⏸️ PAUSE] ✅ PROCEEDING - setting pause state (user has control access)');
    isProcessingLocalPlayPause.current = true;
    lastLocalAction.current = Date.now();
    setIsPlaying(false);
    setShowPlayOverlay(false);
    isWaitingForInteraction.current = false;
    
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    console.log('[⏸️ PAUSE] 📤 Sending pause event', { time: currentTime, isHost, userId: localUser.current.id });
    sendPause(currentTime);
    
    // Reset the flag after a short delay to allow state to stabilize
    setTimeout(() => {
      isProcessingLocalPlayPause.current = false;
      console.log('[⏸️ PAUSE] 🔓 Released processing lock');
    }, 300);
  }

  function handleSeek(seconds: number) {
    console.log('[🔍 SEEK] handleSeek called', {
      seconds,
      userId: localUser.current.id,
      isHost,
      isApplyingRemote: isApplyingRemote.current,
      hasSocket: !!socketRef.current,
    });
    
    // Check control access - only host or users with granted access can seek
    if (!hasControlAccess()) {
      console.log('[🔍 SEEK] 🚫 BLOCKED - No control access. Only host or users with granted access can control playback.');
      return;
    }
    
    if (isApplyingRemote.current || !socketRef.current) {
      console.log('[🔍 SEEK] ⚠️ BLOCKED - early return');
      return;
    }
    
    console.log('[🔍 SEEK] ✅ PROCEEDING - sending seek event (user has control access)');
    lastLocalAction.current = Date.now();
    sendSeek(seconds);
  }

  function handlePlaybackRateChange(rate: number) {
    setPlaybackRate(rate);
    if (isHost && socketRef.current) {
      sendSync(playerRef.current?.getCurrentTime() || 0, isPlaying);
    }
  }

  function handleManualPlay() {
    console.log('[👆 MANUAL PLAY] handleManualPlay called', {
      isHost,
      isProcessingLocal: isProcessingLocalPlayPause.current,
      isApplyingRemote: isApplyingRemote.current,
      userInteracted,
      showPlayOverlay,
    });
    
    if (isProcessingLocalPlayPause.current) {
      console.log('[👆 MANUAL PLAY] ⚠️ BLOCKED - already processing');
      return;
    }
    
    console.log('[👆 MANUAL PLAY] ✅ PROCEEDING - attempting manual play');
    setUserInteracted(true);
    setShowPlayOverlay(false);
    isWaitingForInteraction.current = false;
    
    // Use handlePlay to ensure consistency and prevent conflicts
    if (playerRef.current) {
      const internalPlayer = playerRef.current.getInternalPlayer();
      const currentTime = playerRef.current.getCurrentTime();
      console.log('[👆 MANUAL PLAY] Player state', {
        hasInternalPlayer: !!internalPlayer,
        isPaused: internalPlayer?.paused,
        currentTime,
      });
      
      if (internalPlayer && internalPlayer.paused) {
        console.log('[👆 MANUAL PLAY] 📺 Calling internalPlayer.play()');
        // Let ReactPlayer's onPlay callback handle the state update
        internalPlayer.play()
          .then(() => console.log('[👆 MANUAL PLAY] ✅ Play promise resolved'))
          .catch(e => console.log('[👆 MANUAL PLAY] ❌ Manual play failed:', e));
      } else {
        console.log('[👆 MANUAL PLAY] ⚠️ Player not paused or not available');
      }
    }
  }

  function handleEmojiReactionLocal(emoji: string) {
    const reaction: Reaction = {
      id: `${localUser.current.id}-${Date.now()}`,
      userId: localUser.current.id,
      name: localUser.current.name,
      emoji: emoji,
      at: new Date().toISOString()
    };
    
    setReactions(prev => [...prev, reaction]);
    socketRef.current?.emit("room:emoji:reaction", { sessionId, emoji });
    setShowEmojiPicker(false);
    
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);
  }

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim() || !socketRef.current) return;
    
    // Check if chat is enabled
    if (!chatEnabled) {
      alert('Chat is currently disabled by the host');
      return;
    }
    
    const msg: ChatMessage = {
      id: `${Date.now()}_${makeId(4)}`,
      userId: localUser.current.id,
      name: localUser.current.name,
      text: messageText.trim(),
      at: new Date().toISOString()
    };

    // Do not add message locally to avoid duplicates — server will echo and broadcast
    socketRef.current.emit("room:chat:message", { sessionId, message: msg });
    setMessageText("");
  }

  async function copySessionLink() {
    const url = `${window.location.origin}/group/${sessionId}?movie=${encodeURIComponent(currentMovie.id || currentMovie.title)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }

  // Control access management functions
  function grantControlAccess(participantId: string) {
    if (!isHost || !socketRef.current) {
      console.log('[🔐 CONTROL] 🚫 Cannot grant access - not host or no socket');
      return;
    }
    
    console.log('[🔐 CONTROL] ✅ Granting control access', {
      hostId: localUser.current.id,
      targetParticipantId: participantId,
      sessionId,
    });
    
    setControlAccessUsers(prev => {
      const updated = new Set(prev);
      updated.add(participantId);
      console.log('[🔐 CONTROL] Updated control users', { allUsers: Array.from(updated) });
      return updated;
    });
    
    // Broadcast to all participants
    socketRef.current.emit('room:control:grant', {
      sessionId,
      participantId,
      grantedBy: localUser.current.id,
      at: Date.now(),
    });
    
    // Update participants list to reflect control access
    setParticipants(prev => prev.map(p => 
      p.id === participantId ? { ...p, hasControlAccess: true } : p
    ));
  }

  function revokeControlAccess(participantId: string) {
    if (!isHost || !socketRef.current) {
      console.log('[🔐 CONTROL] 🚫 Cannot revoke access - not host or no socket');
      return;
    }
    
    console.log('[🔐 CONTROL] ❌ Revoking control access', {
      hostId: localUser.current.id,
      targetParticipantId: participantId,
      sessionId,
    });
    
    setControlAccessUsers(prev => {
      const updated = new Set(prev);
      updated.delete(participantId);
      console.log('[🔐 CONTROL] Updated control users', { allUsers: Array.from(updated) });
      return updated;
    });
    
    // Broadcast to all participants
    socketRef.current.emit('room:control:revoke', {
      sessionId,
      participantId,
      revokedBy: localUser.current.id,
      at: Date.now(),
    });
    
    // Update participants list to reflect control access
    setParticipants(prev => prev.map(p => 
      p.id === participantId ? { ...p, hasControlAccess: false } : p
    ));
  }

  function handleControlAccessGranted(data: { participantId: string; grantedBy: string }) {
    console.log('[🔐 CONTROL] 📥 Received control access grant', data);
    
    if (data.participantId === localUser.current.id) {
      console.log('[🔐 CONTROL] 🎉 You have been granted control access!');
      setControlAccessUsers(prev => new Set(prev).add(data.participantId));
    }
    
    // Update participants list
    setParticipants(prev => prev.map(p => 
      p.id === data.participantId ? { ...p, hasControlAccess: true } : p
    ));
  }

  function handleControlAccessRevoked(data: { participantId: string; revokedBy: string }) {
    console.log('[🔐 CONTROL] 📥 Received control access revoke', data);
    
    if (data.participantId === localUser.current.id) {
      console.log('[🔐 CONTROL] 😞 Your control access has been revoked');
      setControlAccessUsers(prev => {
        const updated = new Set(prev);
        updated.delete(data.participantId);
        return updated;
      });
    }
    
    // Update participants list
    setParticipants(prev => prev.map(p => 
      p.id === data.participantId ? { ...p, hasControlAccess: false } : p
    ));
  }

  function leaveSession() {
    if (socketRef.current) {
      socketRef.current.emit("room:leave", { sessionId });
      socketRef.current.disconnect();
    }
    if (mediaStream.localStream) mediaStream.localStream.getTracks().forEach(t => t.stop());
    globalThis.location.href = "/";
  }

  // Load available movies when movie selector opens
  useEffect(() => {
    if (showMovieSelector && availableMovies.length === 0) {
      const loadMovies = async () => {
        try {
          const movies = await fetchMoviesWithVideos();
          setAvailableMovies(movies as unknown as Movie[]);
        } catch (error) {
          console.error('Failed to load movies:', error);
        }
      };
      loadMovies();
    }
  }, [showMovieSelector]);

  function handleChangeMovie(selectedMovie: Movie) {
    // Check authentication - host or authenticated participants can change movie
    if (!isAuthenticated && !isHost) {
      console.log('[🎬 CHANGE MOVIE] ⚠️ User not authenticated, showing auth modal');
      setShowAuthModal(true);
      setShowMovieSelector(false);
      return;
    }

    if (!socketRef.current) {
      console.log('[🎬 CHANGE MOVIE] ⚠️ Socket not available');
      return;
    }
    
    console.log('[🎬 CHANGE MOVIE] Changing movie', { 
      isHost, 
      isAuthenticated,
      from: currentMovie.id, 
      to: selectedMovie.id,
      userName: localUser.current.name
    });
    
    // Update local movie state
    setCurrentMovie(selectedMovie);
    
    // Reset player state
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      setIsPlaying(false);
    }
    
    // Broadcast movie change to all participants
    socketRef.current.emit('room:movie:update', {
      sessionId,
      movie: selectedMovie,
    });
    
    setShowMovieSelector(false);
  }

  function handleChangeMovieClick() {
    // Check if user is authenticated
    if (!isAuthenticated && !isHost) {
      setShowAuthModal(true);
      return;
    }
    setShowMovieSelector(true);
  }

  // User interaction handling
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true);
        setShowPlayOverlay(false);
        
        if (isWaitingForInteraction.current && playerRef.current) {
          const internalPlayer = playerRef.current.getInternalPlayer();
          if (internalPlayer && internalPlayer.paused && isPlaying) {
            internalPlayer.play().catch(e => console.log('❌ Play failed:', e.message));
          }
          isWaitingForInteraction.current = false;
        }
      }
    };

    const events = ['click', 'touchstart', 'keydown', 'mousedown'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [userInteracted, isPlaying]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Listen for control access socket events
  useEffect(() => {
    if (!socketRef.current) return;
    
    const socket = socketRef.current;
    
    const handleGrant = (data: { participantId: string; grantedBy: string }) => {
      handleControlAccessGranted(data);
    };
    
    const handleRevoke = (data: { participantId: string; revokedBy: string }) => {
      handleControlAccessRevoked(data);
    };
    
    socket.on('room:control:grant', handleGrant);
    socket.on('room:control:revoke', handleRevoke);
    
    console.log('[🔐 CONTROL] Registered socket listeners for control access events');
    
    return () => {
      socket.off('room:control:grant', handleGrant);
      socket.off('room:control:revoke', handleRevoke);
    };
  }, [socketRef]);

  // Listen for host control socket events
  useEffect(() => {
    if (!socketRef.current) return;
    
    const socket = socketRef.current;
    
    // Host restart
    const handleRestart = () => {
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        setIsPlaying(false);
      }
    };
    
    // Host end session
    const handleEndSession = () => {
      window.location.href = '/home';
    };
    
    // Host lock/unlock
    const handleLock = (data: { locked: boolean }) => {
      setIsLocked(data.locked);
    };
    
    // Host privacy change
    const handlePrivacy = (data: { isPrivate: boolean }) => {
      setIsPrivate(data.isPrivate);
    };
    
    // Host chat toggle
    const handleChatToggle = (data: { enabled: boolean }) => {
      setChatEnabled(data.enabled);
    };
    
    // Host layout change
    const handleLayout = (data: { layout: string }) => {
      setCurrentLayout(data.layout);
    };
    
    // Host fullscreen
    const handleFullscreen = (data: { enabled: boolean }) => {
      if (data.enabled && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    };
    
    // Host promoted/demoted
    const handlePromoted = (data: { userId: string }) => {
      setCoHostIds(prev => [...prev, data.userId]);
    };
    
    const handleDemoted = (data: { userId: string }) => {
      setCoHostIds(prev => prev.filter(id => id !== data.userId));
    };
    
    // Host removed user
    const handleRemoved = (data?: any) => {
      const reason = data?.reason || 'removed_by_host';
      const msg = reason === 'removed_by_host' ? 'You have been removed by the host' : (data?.message || 'You have been removed from this room');
      setRemovedMessage(msg);
      setRemovedByHost(true);

      // stop local streams and pause player
      try {
        if (playerRef.current) {
          const internal = (playerRef.current as any).getInternalPlayer?.();
          if (internal && !internal.paused) internal.pause?.();
        }
      } catch (e) { /* ignore */ }

      if (mediaStream.localStream) {
        try { mediaStream.localStream.getTracks().forEach(t => t.stop()); } catch (e) { /* ignore */ }
      }

      // Give user a short moment to read the notice, then leave
      setTimeout(() => {
        try {
          if (socketRef.current) {
            socketRef.current.emit('room:leave', { sessionId });
            socketRef.current.disconnect();
          }
        } catch (e) {}
        window.location.href = '/home';
      }, 3500);
    };
    
    // Host banned user
    const handleBanned = () => {
      alert('You have been banned from this room');
      window.location.href = '/home';
    };
    
    // Host kicked user
    const handleKicked = () => {
      alert('You have been kicked from this room');
      window.location.href = '/home';
    };
    
    // Chat cleared
    const handleChatCleared = () => {
      setMessages([]);
    };
    
    // Message deleted
    const handleMessageDeleted = (data: { messageId: string }) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, isDeleted: true } : m));
    };
    
    // Message pinned
    const handleMessagePinned = (data: { messageId: string; pinned: boolean }) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, isPinned: data.pinned } : m));
    };
    
    socket.on('room:host:restart', handleRestart);
    socket.on('room:host:ended', handleEndSession);
    socket.on('room:host:locked', handleLock);
    socket.on('room:host:privacy:changed', handlePrivacy);
    socket.on('room:host:chat:toggled', handleChatToggle);
    socket.on('room:host:layout:changed', handleLayout);
    socket.on('room:host:fullscreen', handleFullscreen);
    socket.on('room:host:promoted', handlePromoted);
    socket.on('room:host:demoted', handleDemoted);
    socket.on('room:removed', handleRemoved);
    socket.on('room:banned', handleBanned);
    socket.on('room:kicked', handleKicked);
    socket.on('room:host:chat:cleared', handleChatCleared);
    socket.on('room:host:message:deleted', handleMessageDeleted);
    socket.on('room:host:message:pinned', handleMessagePinned);
    
    return () => {
      socket.off('room:host:restart', handleRestart);
      socket.off('room:host:ended', handleEndSession);
      socket.off('room:host:locked', handleLock);
      socket.off('room:host:privacy:changed', handlePrivacy);
      socket.off('room:host:chat:toggled', handleChatToggle);
      socket.off('room:host:layout:changed', handleLayout);
      socket.off('room:host:fullscreen', handleFullscreen);
      socket.off('room:host:promoted', handlePromoted);
      socket.off('room:host:demoted', handleDemoted);
      socket.off('room:removed', handleRemoved);
      socket.off('room:banned', handleBanned);
      socket.off('room:kicked', handleKicked);
      socket.off('room:host:chat:cleared', handleChatCleared);
      socket.off('room:host:message:deleted', handleMessageDeleted);
      socket.off('room:host:message:pinned', handleMessagePinned);
    };
  }, [socketRef]);

  // Calculate participants - ensure local user is included and not duplicated
  // Check if local user is already in participants array (from socket)
  const localUserInParticipants = participants.find(p => p.id === localUser.current.id || p.socketId === socketRef.current?.id);
  
  const allParticipants = localUserInParticipants
    ? participants.map(p => {
        // Update local user with current media stream state
        if (p.id === localUser.current.id || p.socketId === socketRef.current?.id) {
          return {
            ...p,
            muted: mediaStream.muted,
            cameraOn: mediaStream.cameraOn,
            stream: mediaStream.localStream || undefined,
            isHost
          };
        }
        return p;
      })
    : [
        // Local user not in participants yet, add it
        {
          ...localUser.current,
          muted: mediaStream.muted,
          cameraOn: mediaStream.cameraOn,
          stream: mediaStream.localStream || undefined,
          socketId: socketRef.current?.id || 'local',
          isHost
        },
        ...participants.filter(p => p.id !== localUser.current.id && p.socketId !== socketRef.current?.id)
      ];

  // Remove any duplicates based on id or socketId
  const uniqueParticipants = allParticipants.filter((p, index, self) => 
    index === self.findIndex(participant => 
      participant.id === p.id || 
      (participant.socketId && p.socketId && participant.socketId === p.socketId)
    )
  );

  const participantCount = uniqueParticipants.length;
  const localParticipant = uniqueParticipants.find(p => p.id === localUser.current.id) || uniqueParticipants[0];
  // If removed by host, render a blocking removed view
  if (removedByHost) {
    return (
      <div className="h-screen w-screen bg-black text-white flex items-center justify-center">
        <div className="bg-gray-900 border border-red-700 rounded-lg p-8 max-w-lg mx-4 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-3">You have been removed</h2>
          <p className="text-gray-300 mb-6">{removedMessage || 'You have been removed from this session by the host.'}</p>
          <button
            onClick={() => { try { if (socketRef.current) { socketRef.current.emit('room:leave', { sessionId }); socketRef.current.disconnect(); } } catch (e) {} window.location.href = '/'; }}
            className="px-5 py-2 bg-red-500 text-white rounded font-semibold"
          >
            Leave
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden">
      <Header
        movieTitle={currentMovie?.title}
        movieYear={currentMovie?.year}
        sessionId={sessionId}
        isHost={isHost}
        copied={copied}
        onCopyLink={copySessionLink}
        onSettingsClick={() => setShowHostControls(true)}
      />

      {/* Removed notice banner */}
      {removedByHost && (
        <div className="fixed right-6 top-20 z-[80] w-72 p-3 bg-red-900/95 border border-red-700 rounded-lg shadow-lg">
          <div className="font-bold text-white">Removed from room</div>
          <div className="text-sm text-gray-200 mt-1">{removedMessage || 'You have been removed from this session by the host.'}</div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => { try { if (socketRef.current) { socketRef.current.emit('room:leave', { sessionId }); socketRef.current.disconnect(); } } catch (e) {} window.location.href = '/home'; }}
              className="px-3 py-1 bg-white text-red-700 rounded text-sm font-semibold"
            >
              Leave now
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <CameraPanel
          show={showCameraPanel}
          width={cameraPanelWidth}
          onClose={() => setShowCameraPanel(false)}
          onWidthChange={setCameraPanelWidth}
          localParticipant={localParticipant}
          participantCount={participantCount}
        />

        <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${showCameraPanel ? 'ml-0' : 'ml-0'}`}>
          <PlayerArea
            movie={currentMovie}
            isPlaying={isPlaying}
            userInteracted={userInteracted}
            playbackRate={playbackRate}
            showPlayOverlay={showPlayOverlay}
            isHost={isHost}
            participantCount={participantCount}
            showCameraPanel={showCameraPanel}
            reactions={reactions}
            onToggleCameraPanel={() => setShowCameraPanel(true)}
            onPlayerReady={handlePlayerReady}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            onPlaybackRateChange={handlePlaybackRateChange}
            onManualPlay={handleManualPlay}
            playerRef={playerRef}
          />
        </div>

        {showChat && (
          <ChatPanel
            messages={messages}
            messageText={messageText}
            localUserId={localUser.current.id}
            participants={uniqueParticipants}
            onMessageChange={setMessageText}
            onSendMessage={handleSendMessage}
          />
        )}

        {showParticipants && (
          <ParticipantsPanel
            participants={uniqueParticipants}
            localUserId={localUser.current.id}
            isHost={isHost}
            onGrantControlAccess={grantControlAccess}
            onRevokeControlAccess={revokeControlAccess}
            socketRef={socketRef}
            sessionId={sessionId}
          />
        )}
      </div>

      <ControlBar
        muted={mediaStream.muted}
        cameraOn={mediaStream.cameraOn}
        showCameraPanel={showCameraPanel}
        showParticipants={showParticipants}
        showChat={showChat}
        showEmojiPicker={showEmojiPicker}
        emojiPickerRef={emojiPickerRef}
        participantCount={participantCount}
        isHost={isHost}
        isCoHost={coHostIds.includes(localUser.current.id)}
        onChangeMovie={handleChangeMovieClick}
        isAuthenticated={isAuthenticated}
        onToggleHostControls={() => setShowHostControls(!showHostControls)}
        onToggleMute={() => {
          mediaStream.toggleMute();
          socketRef.current?.emit('room:status', {
            sessionId,
            muted: !mediaStream.muted
          });
        }}
        onToggleCamera={() => {
          mediaStream.toggleCamera();
          socketRef.current?.emit('room:status', {
            sessionId,
            cameraOn: !mediaStream.cameraOn
          });
        }}
        onToggleCameraPanel={() => setShowCameraPanel(!showCameraPanel)}
        onToggleParticipants={() => setShowParticipants(!showParticipants)}
        onToggleChat={() => setShowChat(!showChat)}
        onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
        onEmojiReaction={handleEmojiReactionLocal}
        onLeave={leaveSession}
        emojiReactions={EMOJI_REACTIONS}
      />

      {mediaStream.mediaError && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-red-600/90 text-white px-2 py-1 rounded text-xs backdrop-blur-sm z-50">
          {mediaStream.mediaError}
        </div>
      )}

      {/* Movie Selection Modal */}
      {showMovieSelector && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-2xl border border-[#00bfa6]/30 max-w-6xl w-full max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#00bfa6]/20">
              <h2 className="text-2xl font-bold text-white">Change Movie</h2>
              <button
                onClick={() => setShowMovieSelector(false)}
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Movie Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {availableMovies.length === 0 ? (
                <div className="text-center py-12 text-gray-400">Loading movies...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {availableMovies.map((movie) => (
                    <motion.button
                      key={movie.id}
                      onClick={() => handleChangeMovie(movie)}
                      className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 hover:border-2 hover:border-[#00bfa6] transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <h3 className="text-white font-semibold text-sm line-clamp-2">{movie.title}</h3>
                        <p className="text-gray-300 text-xs mt-1">{movie.year}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Auth Modal for Change Movie */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          setShowAuthModal(false);
          // After successful auth, open movie selector if user is now authenticated
          if (isAuthenticated) {
            setTimeout(() => {
              setShowMovieSelector(true);
            }, 100);
          }
        }} 
      />

      {/* Host Control Panel */}
      <HostControlPanel
        isHost={isHost}
        isCoHost={coHostIds.includes(localUser.current.id)}
        sessionId={sessionId}
        participants={allParticipants}
        isOpen={showHostControls}
        onClose={() => setShowHostControls(false)}
        onLogout={() => { logout(); window.location.href = '/'; }}
        onUpdateProfile={(data) => {
          // update local store
          updateUser({ name: data.name, email: data.email, avatar: data.avatar });
          // emit participant update
          if (socketRef.current) socketRef.current.emit('room:participant:update', { sessionId, name: data.name, avatar: data.avatar });
        }}
        socketRef={socketRef}
        currentUser={{ name: localUser.current.name, email: user?.email, avatar: user?.avatar }}
      />

      <style>{`
        @keyframes reactionFloat {
          0% {
            transform: translate(-50%, 0) scale(0.8);
            opacity: 0;
          }
          20% {
            transform: translate(-50%, -20px) scale(1.2);
            opacity: 1;
          }
          80% {
            transform: translate(-50%, -60px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -80px) scale(0.8);
            opacity: 0;
          }
        }
        .animate-reaction-float {
          animation: reactionFloat 3s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default GroupWatch;