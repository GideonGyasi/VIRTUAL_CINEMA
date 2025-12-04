import React from "react";
import { MicOff, Crown, UserX  } from "lucide-react";
import type{ Participant } from "./types";

interface ParticipantsPanelProps {
  participants: Participant[];
  localUserId: string;
  isHost: boolean;
  onGrantControlAccess?: (participantId: string) => void;
  onRevokeControlAccess?: (participantId: string) => void;
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  participants,
  localUserId,
  isHost,
  onGrantControlAccess,
  onRevokeControlAccess,
}) => {
  const handleToggleControl = (participant: Participant, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[👥 PARTICIPANTS] Toggling control access', {
      participantId: participant.id,
      participantName: participant.name,
      hasAccess: participant.hasControlAccess,
      isHost,
    });
    
    if (participant.hasControlAccess) {
      onRevokeControlAccess?.(participant.id);
    } else {
      onGrantControlAccess?.(participant.id);
    }
  };

  return (
    <div className="w-60 bg-black/90 backdrop-blur-sm border-l border-emerald-900/20">
      <div className="p-2 border-b border-emerald-900/20 bg-emerald-950/10">
        <h3 className="font-semibold text-xs text-emerald-400">
          Audience ({participants.length})
        </h3>
      </div>
      <div className="p-2 space-y-1 overflow-auto max-h-full">
        {participants.map((participant) => {
          const isLocalUser = participant.id === localUserId;
          const canManageControl = isHost && !isLocalUser && !participant.isHost;
          
          return (
            <div
              key={participant.id}
              className="flex items-center gap-2 p-1.5 rounded-md bg-gray-900/20 border border-emerald-900/10 hover:bg-gray-800/30 transition-colors group"
            >
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-700 to-gray-900 flex items-center justify-center border border-emerald-600/20">
                  <span className="text-[10px] font-bold text-emerald-300">
                    {participant.name[0].toUpperCase()}
                  </span>
                </div>
                {participant.isHost && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full border border-black animate-pulse"></div>
                )}
                {participant.hasControlAccess && !participant.isHost && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full border border-black"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate flex items-center gap-1">
                  {participant.name} {isLocalUser && "(You)"}
                  {participant.isHost && (
                    <span className="text-[8px] bg-emerald-900/50 px-1 py-0.5 rounded text-emerald-300">HOST</span>
                  )}
                  {participant.hasControlAccess && !participant.isHost && (
                    <span className="text-[8px] bg-yellow-900/50 px-1 py-0.5 rounded text-yellow-300">CONTROL</span>
                  )}
                </div>
                <div className="text-[10px] text-emerald-300 flex items-center gap-0.5">
                  {participant.muted ? (
                    <span className="flex items-center gap-0.5"><MicOff size={8} /> Muted</span>
                  ) : (
                    <span className="text-green-400 text-[8px]">● Live</span>
                  )}
                  {participant.cameraOn && (
                    <span className="text-blue-400 text-[8px]">● Cam</span>
                  )}
                </div>
              </div>
              {canManageControl && (
                <button
                  onClick={(e) => handleToggleControl(participant, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-emerald-900/30 rounded"
                  title={participant.hasControlAccess ? "Revoke control access" : "Grant control access"}
                >
                  {participant.hasControlAccess ? (
                    <UserX  size={14} className="text-yellow-400" />
                  ) : (
                    <Crown size={14} className="text-gray-400" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ParticipantsPanel;