import React, { useEffect, useRef } from "react";
import AudioVisualizer from "./AudioVisualizer";

interface VideoStreamProps {
  stream: MediaStream | null;
  isLocal: boolean;
  cameraOn: boolean;
  muted?: boolean;
  className?: string;
}

const VideoStream: React.FC<VideoStreamProps> = ({ 
  stream, 
  isLocal, 
  cameraOn,
  muted = false,
  className = "" 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (stream) {
      videoElement.srcObject = stream;
      videoElement.play().catch(console.error);
    }

    return () => {
      if (videoElement) videoElement.srcObject = null;
    };
  }, [stream]);

  // Get audio track from stream
  const hasAudio = stream && stream.getAudioTracks().length > 0;
  const audioStream = hasAudio && stream ? new MediaStream(stream.getAudioTracks()) : null;

  return (
    <div className={`relative w-full h-full ${className}`}>
      {cameraOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover bg-black"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-emerald-900/50 rounded">
          <span className="text-white font-bold text-xl">
            {isLocal ? "You" : "Off"}
          </span>
        </div>
      )}
      
      {/* Audio Visualizer - shows when not muted and has audio, positioned at bottom */}
      {!muted && audioStream && (
        <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          <AudioVisualizer 
            stream={audioStream} 
          isActive={!muted && !!hasAudio}
            className="h-6"
          />
        </div>
      )}
    </div>
  );
};

export default VideoStream;