import { useRef, useEffect } from "react";

interface UseSyncProps {
  isHost: boolean;
  sessionId: string;
  playbackRate: number;
  playerReady: boolean;
  socketRef: React.RefObject<any>;
  playerRef: React.RefObject<any>;
  isApplyingRemote: React.MutableRefObject<boolean>;
}

export const useSync = ({
  isHost,
  sessionId,
  playbackRate,
  playerReady,
  socketRef,
  playerRef,
  isApplyingRemote,
}: UseSyncProps) => {
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  // --------------------------
  // Host periodic sync
  // --------------------------
 useEffect(() => {
  if (!isHost || !socketRef.current || !playerRef.current || !playerReady) return;

  if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);

  let lastSentTime = playerRef.current.getCurrentTime();
  let lastSentPlaying = false;

  syncIntervalRef.current = setInterval(() => {
    if (!playerRef.current || isApplyingRemote.current) return;

    const player = playerRef.current.getInternalPlayer();
    if (!player) return;

    const currentTime = playerRef.current.getCurrentTime();
    const isPlaying = !player.paused;

    const timeDiff = Math.abs(currentTime - lastSentTime);
    const stateChanged = isPlaying !== lastSentPlaying;

    // Only send if time drift > 0.5s OR play/pause changed
    if (timeDiff > 0.5 || stateChanged) {
      socketRef.current.emit("room:video:sync", {
        sessionId,
        time: currentTime,
        isPlaying,
        playbackRate,
        at: Date.now(),
      });

      lastSentTime = currentTime;
      lastSentPlaying = isPlaying;
    }
  }, 500); // check frequently but only emit when necessary

  return () => {
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
  };
}, [isHost, sessionId, playbackRate, playerReady]);

  // --------------------------
  // Emit video events
  // --------------------------
  const sendPlay = (time: number) => {
    console.log('[📤 SEND] Sending room:video:play', { sessionId, time, isHost });
    socketRef.current?.emit("room:video:play", { sessionId, time, at: Date.now() });
  };

  const sendPause = (time: number) => {
    console.log('[📤 SEND] Sending room:video:pause', { sessionId, time, isHost });
    socketRef.current?.emit("room:video:pause", { sessionId, time, at: Date.now() });
  };

  const sendSeek = (time: number) => {
    console.log('[📤 SEND] Sending room:video:seek', { sessionId, time, isHost });
    socketRef.current?.emit("room:video:seek", { sessionId, time, at: Date.now() });
  };

  const sendSync = (time: number, isPlaying: boolean) => {
    console.log('[📤 SEND] Sending room:video:sync', { sessionId, time, isPlaying, playbackRate, isHost });
    socketRef.current?.emit("room:video:sync", { sessionId, time, isPlaying, playbackRate, at: Date.now() });
  };

  // --------------------------
  // Participant: listen for remote events
  // --------------------------
  useEffect(() => {
    // Only participants should listen to remote events - host controls its own player
    if (isHost) {
      console.log('[🔧 useSync] ⏭️ SKIPPING - Host does not listen to remote events');
      return;
    }
    if (!socketRef.current || !playerRef.current) {
      console.log('[🔧 useSync] ⏭️ SKIPPING - Missing socket or player ref');
      return;
    }
    console.log('[🔧 useSync] ✅ Registering remote event listeners for participant');
    const socket = socketRef.current;

    const handlePlay = ({ time }: { time: number }) => {
      console.log('[🔧 useSync] handlePlay called', { time, isHost });
      if (!playerRef.current) {
        console.log('[🔧 useSync] ⚠️ No player ref');
        return;
      }
      console.log('[🔧 useSync] ✅ Applying remote play');
      isApplyingRemote.current = true;
      playerRef.current.seekTo(time, "seconds");
      playerRef.current.getInternalPlayer()?.play();
      isApplyingRemote.current = false;
      console.log('[🔧 useSync] 🔓 Released remote lock');
    };

    const handlePause = ({ time }: { time: number }) => {
      console.log('[🔧 useSync] handlePause called', { time, isHost });
      if (!playerRef.current) {
        console.log('[🔧 useSync] ⚠️ No player ref');
        return;
      }
      console.log('[🔧 useSync] ✅ Applying remote pause');
      isApplyingRemote.current = true;
      playerRef.current.seekTo(time, "seconds");
      playerRef.current.getInternalPlayer()?.pause();
      isApplyingRemote.current = false;
      console.log('[🔧 useSync] 🔓 Released remote lock');
    };

    const handleSeek = ({ time }: { time: number }) => {
      console.log('[🔧 useSync] handleSeek called', { time, isHost });
      if (!playerRef.current) {
        console.log('[🔧 useSync] ⚠️ No player ref');
        return;
      }
      console.log('[🔧 useSync] ✅ Applying remote seek');
      isApplyingRemote.current = true;
      playerRef.current.seekTo(time, "seconds");
      isApplyingRemote.current = false;
      console.log('[🔧 useSync] 🔓 Released remote lock');
    };

    const handleSync = ({ time, isPlaying }: { time: number; isPlaying: boolean }) => {
      console.log('[🔧 useSync] handleSync called', { time, isPlaying, isHost });
      if (!playerRef.current) {
        console.log('[🔧 useSync] ⚠️ No player ref');
        return;
      }
      console.log('[🔧 useSync] ✅ Applying remote sync');
      isApplyingRemote.current = true;

      const player = playerRef.current.getInternalPlayer();
      const localTime = playerRef.current.getCurrentTime();
      const localIsPlaying = player && !player.paused;

      console.log('[🔧 useSync] Sync state', {
        localTime,
        remoteTime: time,
        timeDiff: Math.abs(localTime - time),
        localIsPlaying,
        remoteIsPlaying: isPlaying,
      });

      // Only seek if out of sync by >0.5s
      if (Math.abs(localTime - time) > 0.5) {
        console.log('[🔧 useSync] 🔄 Seeking to remote time');
        playerRef.current.seekTo(time, "seconds");
      }

      // Only play/pause if state differs
      if (localIsPlaying !== isPlaying) {
        console.log('[🔧 useSync] 🔄 State differs - changing play state', {
          from: localIsPlaying,
          to: isPlaying,
        });
        if (isPlaying) {
          console.log('[🔧 useSync] ▶️ Calling player.play()');
          player?.play();
        } else {
          console.log('[🔧 useSync] ⏸️ Calling player.pause()');
          player?.pause();
        }
      } else {
        console.log('[🔧 useSync] ✅ State already matches - no change needed');
      }

      isApplyingRemote.current = false;
      console.log('[🔧 useSync] 🔓 Released remote lock');
    };

    socket.on("room:video:play", handlePlay);
    socket.on("room:video:pause", handlePause);
    socket.on("room:video:seek", handleSeek);
    socket.on("room:video:sync", handleSync);

    // Optional: request sync on join
    if (!isHost) {
      socket.emit("room:request-sync", { sessionId });
    }

    return () => {
      socket.off("room:video:play", handlePlay);
      socket.off("room:video:pause", handlePause);
      socket.off("room:video:seek", handleSeek);
      socket.off("room:video:sync", handleSync);
    };
  }, [socketRef, playerRef, isHost, isApplyingRemote, sessionId]);

  return { sendPlay, sendPause, sendSeek, sendSync };
};
