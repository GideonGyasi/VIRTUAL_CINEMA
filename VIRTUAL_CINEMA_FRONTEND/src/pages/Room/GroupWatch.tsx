import React, { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import Header from "../../components/GroupWatch/Header";
import CameraPanel from "../../components/GroupWatch/CameraPanel";
import PlayerArea from "../../components/GroupWatch/PlayerArea";
import ChatPanel from "../../components/GroupWatch/ChatPanel";
import ParticipantsPanel from "../../components/GroupWatch/ParticipantsPanel";
import VideoStream from "../../components/GroupWatch/VideoStream";
import ControlBar from "../../components/GroupWatch/ControlBar";
import { useSocket } from "../../components/GroupWatch/hooks/useSocket";
import { useSync } from "../../components/GroupWatch/hooks/useSync";
import { useMediaStream } from "../../components/GroupWatch/hooks/useMediaStream";

import { makeId, EMOJI_REACTIONS } from "../../components/GroupWatch/utils";
import type{ GroupWatchProps, Participant, ChatMessage, Reaction, Movie } from "../../components/GroupWatch/types";

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

  // Refs
  const playerRef = useRef<ReactPlayer>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const isApplyingRemote = useRef(false);
  const lastLocalAction = useRef(0);
  const pendingSyncData = useRef<any>(null);
  const isWaitingForInteraction = useRef(false);
  const isProcessingLocalPlayPause = useRef(false);

  // User info
  const guestId = useRef(`guest_${Math.random().toString(36).slice(2, 9)}`);
  const localUser = useRef({ 
    id: guestId.current, 
    name: displayName || `Guest_${makeId(4)}` 
  });

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
    if (movieData.src === currentMovie.src || movieData.id === currentMovie.id) {
      setCurrentMovie(prev => ({ ...prev, ...movieData }));
      return;
    }
    
    setCurrentMovie(movieData);
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      setIsPlaying(false);
    }
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
    
    const msg: ChatMessage = {
      id: `${Date.now()}_${makeId(4)}`,
      userId: localUser.current.id,
      name: localUser.current.name,
      text: messageText.trim(),
      at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, msg]);
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

  // Calculate participants
  const allParticipants = [
    {
      ...localUser.current,
      muted: mediaStream.muted,
      cameraOn: mediaStream.cameraOn,
      stream: mediaStream.localStream || undefined,
      socketId: socketRef.current?.id || 'local',
      isHost
    },
    ...participants.filter(p => p.id !== localUser.current.id)
  ];

  const participantCount = allParticipants.length;
  const localParticipant = allParticipants[0];

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden">
      <Header
        movieTitle={currentMovie?.title}
        movieYear={currentMovie?.year}
        sessionId={sessionId}
        isHost={isHost}
        copied={copied}
        onCopyLink={copySessionLink}
      />

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

          {/* Mini participant thumbnails */}
          <div className="h-12 flex-shrink-0 border-t border-emerald-900/20 bg-black/30 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-1 p-1 h-full overflow-x-auto">
              {allParticipants.slice(0, 8).map((participant) => (
                <div
                  key={participant.id}
                  className="relative group rounded-md overflow-hidden bg-gray-900 transition-all duration-200 w-10 h-8 border border-emerald-900/10 flex-shrink-0"
                >
                  {participant.cameraOn ? (
                    <VideoStream
                      stream={participant.stream}
                      isLocal={participant.id === localUser.current.id}
                      cameraOn={participant.cameraOn}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-800 to-gray-800">
                      <span className="text-[10px] font-bold text-white">
                        {participant.name[0].toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-0.5">
                    <div className="flex items-center justify-center">
                      {participant.muted && <span className="text-red-400 text-xs">🔇</span>}
                      {participant.isHost && (
                        <span className="text-[6px] text-emerald-400 font-bold ml-0.5">H</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {allParticipants.length > 8 && (
                <div className="text-[8px] text-emerald-400 px-1">
                  +{allParticipants.length - 8}
                </div>
              )}
            </div>
          </div>
        </div>

        {showChat && (
          <ChatPanel
            messages={messages}
            messageText={messageText}
            localUserId={localUser.current.id}
            onMessageChange={setMessageText}
            onSendMessage={handleSendMessage}
          />
        )}

        {showParticipants && (
          <ParticipantsPanel
            participants={allParticipants}
            localUserId={localUser.current.id}
            isHost={isHost}
            onGrantControlAccess={grantControlAccess}
            onRevokeControlAccess={revokeControlAccess}
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