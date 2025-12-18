import React from "react";
import { ChevronLeft, Popcorn } from "lucide-react";
import VideoStream from "./VideoStream";
import type { Participant } from "./types";

interface CameraPanelProps {
  show: boolean;
  width: number;
  onClose: () => void;
  onWidthChange: (width: number) => void;
  localParticipant: Participant;
  participantCount: number;
}

const CameraPanel: React.FC<CameraPanelProps> = ({
  show,
  width,
  onClose,
  onWidthChange,
  localParticipant,
  participantCount,
}) => {
  if (!show) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startX - e.clientX;
      const newWidth = Math.max(240, Math.min(500, startWidth + delta));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };

    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      className="flex flex-col bg-black/90 backdrop-blur-sm border-r border-emerald-900/20 relative"
      style={{ width: `${width}px` }}
    >
      <div
        className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-600/30 hover:bg-emerald-400/50 cursor-col-resize transition-colors z-10"
        onMouseDown={handleMouseDown}
      />
      
      <div className="p-2 border-b border-emerald-900/20 bg-emerald-950/10 flex items-center justify-between">
        <h3 className="font-semibold text-xs text-emerald-400 flex items-center gap-1.5">
          <Popcorn size={14} />
          <span>Participants in cinema ({participantCount})</span>
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-emerald-600/20 rounded transition-colors"
        >
          <ChevronLeft size={14} className="text-emerald-400" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {participantCount === 0 ? (
          <div className="flex items-center justify-center h-32 text-emerald-600 text-sm">
            No participants
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            <div
              key={localParticipant.id}
              className="relative rounded-lg overflow-hidden bg-gradient-to-br from-emerald-900 to-gray-900 border border-emerald-900/20 min-h-32 flex flex-col"
            >
              <div className="flex-1 relative">
                <VideoStream
                  stream={localParticipant.stream ?? null}
                  isLocal={true}
                  cameraOn={localParticipant.cameraOn}
                  muted={localParticipant.muted}
                  className="w-full h-full"
                />

                {!localParticipant.cameraOn && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-700 flex items-center justify-center border-2 border-emerald-500/30">
                      <span className="text-xl font-bold text-white">
                        {localParticipant.name[0].toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="absolute top-2 left-2 flex items-center gap-1">
                  {localParticipant.muted && (
                    <div className="bg-black/70 rounded-full p-1">
                      <span className="text-red-400 text-xs">🔇</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white truncate">
                    {localParticipant.name} (You)
                  </span>
                  <div className="flex items-center gap-1">
                    {!localParticipant.muted && (
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    )}
                    {!localParticipant.cameraOn && (
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraPanel;