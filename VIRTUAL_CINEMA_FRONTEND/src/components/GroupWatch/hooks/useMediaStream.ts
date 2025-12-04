import { useState, useEffect, useCallback } from "react";

export const useMediaStream = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);

  const initializeMediaStream = useCallback(async () => {
    try {
      setMediaError(null);
      
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user" 
        }, 
        audio: true 
      });
      
      setLocalStream(stream);
      setCameraInitialized(true);
      
      stream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
      
      stream.getVideoTracks().forEach(track => {
        track.enabled = cameraOn;
      });
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setMediaError("Cannot access camera or microphone.");
    }
  }, [localStream, muted, cameraOn]);

  useEffect(() => {
    initializeMediaStream();
  }, []);

  useEffect(() => {
    if (localStream && cameraInitialized) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = cameraOn;
      });
    }
  }, [cameraOn, localStream, cameraInitialized]);

  const toggleMute = () => {
    const newMutedState = !muted;
    setMuted(newMutedState);
    
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });
    }
  };

  const toggleCamera = async () => {
    const newCameraState = !cameraOn;
    setCameraOn(newCameraState);
    
    if (newCameraState && !localStream) {
      await initializeMediaStream();
    }
  };

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
    initializeMediaStream
  };
};