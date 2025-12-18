import { useState, useEffect, useCallback, useRef } from "react";

export const useMediaStream = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);

  // Refs for external mutable resources
  const initializedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  const initializeMediaStream = useCallback(async () => {
    try {
      setMediaError(null);

      // Stop old tracks if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      
      // Apply current state to tracks
      stream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });

      stream.getVideoTracks().forEach(track => {
        track.enabled = cameraOn;
      });

      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw error;
    }
  }, [muted, cameraOn]);

  // Initialize ONCE (Strict-Mode safe)
  useEffect(() => {
    if (initializedRef.current) return;

    const init = async () => {
      initializedRef.current = true;
      try {
        const stream = await initializeMediaStream();
        setLocalStream(stream);
        setCameraInitialized(true);
      } catch (error) {
        console.log(error);
        setMediaError("Cannot access camera or microphone.");
        setCameraInitialized(false);
      }
    };

    init();
  }, [initializeMediaStream]);

  // Sync camera state
  useEffect(() => {
    if (!streamRef.current || !cameraInitialized) return;

    streamRef.current.getVideoTracks().forEach(track => {
      track.enabled = cameraOn;
    });
  }, [cameraOn, cameraInitialized]);

  // Sync mute state
  useEffect(() => {
    if (!streamRef.current || !cameraInitialized) return;

    streamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !muted;
    });
  }, [muted, cameraInitialized]);

  const toggleMute = () => {
    setMuted(prev => !prev);
  };

  const toggleCamera = useCallback(async () => {
    const next = !cameraOn;
    setCameraOn(next);

    if (!streamRef.current && next) {
      try {
        const stream = await initializeMediaStream();
        setLocalStream(stream);
        setCameraInitialized(true);
      } catch (error) {
        console.log(error);
        setMediaError("Cannot access camera or microphone.");
        setCameraInitialized(false);
      }
    }
  }, [cameraOn, initializeMediaStream]);

  return {
    localStream,
    mediaError,
    muted,
    cameraOn,
    cameraInitialized,
    toggleMute,
    toggleCamera,
    setMuted,
    setCameraOn,
    initializeMediaStream: async () => {
      try {
        const stream = await initializeMediaStream();
        setLocalStream(stream);
        setCameraInitialized(true);
        return stream;
      } catch (error) {
        setMediaError("Cannot access camera or microphone.");
        setCameraInitialized(false);
        throw error;
      }
    },
  };
};