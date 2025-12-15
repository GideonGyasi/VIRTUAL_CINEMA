import React, { useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import { ChevronRight } from "lucide-react";
import type{ Movie, Reaction } from "./types";

interface PlayerAreaProps {
  movie: Movie;
  isPlaying: boolean;
  userInteracted: boolean;
  playbackRate: number;
  showPlayOverlay: boolean;
  isHost: boolean;
  participantCount: number;
  showCameraPanel: boolean;
  reactions: Reaction[];
  onToggleCameraPanel: () => void;
  onPlayerReady: () => void;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onManualPlay: () => void;
  playerRef: React.RefObject<ReactPlayer>;
}

const PlayerArea: React.FC<PlayerAreaProps> = ({
  movie,
  isPlaying,
  userInteracted,
  playbackRate,
  showPlayOverlay,
  isHost,
  showCameraPanel,
  reactions,
  onToggleCameraPanel,
  onPlayerReady,
  onPlay,
  onPause,
  onSeek,
  onPlaybackRateChange,
  onManualPlay,
  playerRef,
}) => {
  const playingProp = isPlaying && userInteracted;
  const prevPlayingRef = useRef(playingProp);
  
  useEffect(() => {
    if (prevPlayingRef.current !== playingProp) {
      console.log('[📺 ReactPlayer] playing prop changed', {
        from: prevPlayingRef.current,
        to: playingProp,
        isPlaying,
        userInteracted,
        isHost,
      });
      prevPlayingRef.current = playingProp;
    }
  }, [playingProp, isPlaying, userInteracted, isHost]);
  
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex items-center justify-center p-1 min-h-0 relative">
        <div className="relative w-full h-full max-w-full max-h-full flex items-center justify-center">
          <ReactPlayer
            ref={playerRef}
            url={movie?.src}
            controls
            width="100%"
            height="100%"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
            }}
            playing={playingProp}
            playbackRate={playbackRate}
            onReady={onPlayerReady}
            onPlay={() => {
              console.log('[📺 ReactPlayer] onPlay callback fired', { isHost, isPlaying, userInteracted });
              onPlay();
            }}
            onPause={() => {
              console.log('[📺 ReactPlayer] onPause callback fired', { isHost, isPlaying, userInteracted });
              onPause();
            }}
            onSeek={onSeek}
            onPlaybackRateChange={onPlaybackRateChange}
            config={{
              file: {
                attributes: {
                  crossOrigin: "anonymous",
                  playsInline: true,
                  preload: "auto"
                },
                forceVideo: true
              }
            }}
          />
          
          {showPlayOverlay && !isHost && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20">
              <div className="text-center p-6 bg-emerald-900/90 rounded-xl border border-emerald-500/40">
                <div className="text-4xl mb-4">▶️</div>
                <div className="text-emerald-300 mb-3 text-lg">Click to Join the Stream</div>
                <div className="text-sm text-emerald-200 mb-4">
                  // eslint-disable-next-line react-hooks/refs
                  The movie is synced with the host at {playerRef.current?.getCurrentTime()?.toFixed(1) || 0}s
                </div>
                <button 
                  onClick={onManualPlay}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium text-lg"
                >
                  Join Stream Now
                </button>
              </div>
            </div>
          )}
          
        </div>


        {!showCameraPanel && (
          <button
            onClick={onToggleCameraPanel}
            className="absolute top-2 right-2 bg-emerald-600/80 hover:bg-emerald-500/80 backdrop-blur-sm rounded-lg p-2 transition-all duration-200 border border-emerald-500/30 group"
          >
            <ChevronRight size={16} className="text-white" />
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Show Cameras
            </div>
          </button>
        )}

        <div className="absolute inset-0 pointer-events-none z-50">
          {reactions.map((reaction) => (
            <div
              key={reaction.id}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-reaction-float"
            >
              <div className="text-3xl bg-black/50 rounded-full p-2 backdrop-blur-sm border border-emerald-500/30">
                {reaction.emoji}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerArea;