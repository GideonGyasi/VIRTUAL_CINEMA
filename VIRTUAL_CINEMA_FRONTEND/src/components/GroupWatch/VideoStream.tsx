import React, { useEffect, useRef } from "react";

interface VideoStreamProps {
  stream: MediaStream | null;
  isLocal: boolean;
  cameraOn: boolean;
  className?: string;
}

const VideoStream: React.FC<VideoStreamProps> = ({ 
  stream, 
  isLocal, 
  cameraOn, 
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
    </div>
  );
};

export default VideoStream;