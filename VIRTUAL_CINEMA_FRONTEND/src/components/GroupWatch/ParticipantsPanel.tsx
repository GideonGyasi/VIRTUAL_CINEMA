import React, { useState } from "react";
import { MicOff, Crown, UserX } from "lucide-react";
import AvatarPicker, { AVATAR_PRESETS, type AvatarOption } from "./AvatarPicker";
import type { Participant } from "./types";
import type { Socket } from "socket.io-client";

/* ---- Socket event typing ---- */
type ParticipantUpdatePayload = {
  sessionId: string | null;
  avatar: string;
};

interface ClientToServerEvents {
  "room:participant:update": (payload: ParticipantUpdatePayload) => void;
}

interface ParticipantsPanelProps {
  participants: Participant[];
  localUserId: string;
  isHost: boolean;
  onGrantControlAccess?: (participantId: string) => void;
  onRevokeControlAccess?: (participantId: string) => void;
  socketRef?: React.RefObject<Socket<ClientToServerEvents> | null>;
  sessionId?: string;
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  participants,
  localUserId,
  isHost,
  onGrantControlAccess,
  onRevokeControlAccess,
  socketRef,
  sessionId,
}) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

  const openAvatarPicker = (participant: Participant) => {
    setEditingParticipant(participant);
    setShowAvatarPicker(true);
  };

  const closeAvatarPicker = () => {
    setShowAvatarPicker(false);
    setEditingParticipant(null);
  };

  const handleAvatarSelect = (avatarOption: AvatarOption) => {
    if (!editingParticipant || !socketRef?.current) return;

    const avatarData = JSON.stringify(avatarOption);

    // Explicitly type the payload
    const payload: ParticipantUpdatePayload = {
      sessionId: sessionId ?? null,
      avatar: avatarData,
    };

    // Use the properly typed socket
    socketRef.current.emit("room:participant:update", payload);
    closeAvatarPicker();
  };

  const renderAvatarPreview = (avatarData?: string) => {
    if (!avatarData) {
      return (
        <div className="w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center text-xs text-white">
          ?
        </div>
      );
    }

    try {
      const avatar = JSON.parse(avatarData) as AvatarOption;
      return (
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: avatar.bgColor, color: avatar.textColor }}
        >
          {avatar.emoji}
        </div>
      );
    } catch {
      return (
        <div className="w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center text-xs text-white">
          A
        </div>
      );
    }
  };

  const getSelectedAvatarId = (avatarData?: string): string => {
    if (!avatarData) return AVATAR_PRESETS[0].id;
    try {
      const avatar = JSON.parse(avatarData) as AvatarOption;
      return avatar.id;
    } catch {
      return AVATAR_PRESETS[0].id;
    }
  };

  const handleToggleControl = (participant: Participant, e: React.MouseEvent) => {
    e.stopPropagation();

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
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full border border-black animate-pulse" />
                )}

                {participant.hasControlAccess && !participant.isHost && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full border border-black" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate flex items-center gap-1">
                  {participant.name} {isLocalUser && "(You)"}
                  {participant.hasControlAccess && !participant.isHost && (
                    <span className="text-[8px] bg-yellow-900/50 px-1 py-0.5 rounded text-yellow-300">
                      CONTROL
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-emerald-300 flex items-center gap-0.5">
                  {participant.muted ? (
                    <span className="flex items-center gap-0.5">
                      <MicOff size={8} /> Muted
                    </span>
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
                  title={participant.hasControlAccess ? "Revoke control" : "Grant control"}
                >
                  {participant.hasControlAccess ? (
                    <UserX size={14} className="text-yellow-400" />
                  ) : (
                    <Crown size={14} className="text-gray-400" />
                  )}
                </button>
              )}

              <button
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-800 rounded"
                onClick={() => openAvatarPicker(participant)}
                title="Change avatar"
              >
                {renderAvatarPreview(participant.avatar)}
              </button>
            </div>
          );
        })}
      </div>

      {showAvatarPicker && editingParticipant && (
        <AvatarPicker
          onSelect={handleAvatarSelect}
          onCancel={closeAvatarPicker}
          selectedId={getSelectedAvatarId(editingParticipant.avatar)}
        />
      )}
    </div>
  );
};

export default ParticipantsPanel;