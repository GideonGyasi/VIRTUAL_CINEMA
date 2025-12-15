import React from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  LogOut,
  Smile,
  Users,
  MessageCircle,
  Popcorn,
  Film,
  Settings,
} from "lucide-react";

// Move ControlButton outside of ControlBar component
interface ControlButtonProps {
  active?: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size: number; className?: string }>;
  text: string;
  danger?: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({ 
  active = false, 
  onClick, 
  icon: Icon, 
  text, 
  danger = false 
}) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-1 p-1.5 rounded-md transition-all duration-200 border text-xs ${
      danger 
        ? 'bg-red-600/20 border-red-500/20 hover:bg-red-600/30' 
        : active 
          ? 'bg-emerald-600/30 border-emerald-400' 
          : 'bg-emerald-600/20 border-emerald-500/20'
    }`}
  >
    <Icon size={14} className={danger ? "text-red-400" : "text-emerald-400"} />
    <span className="font-medium text-[10px]">{text}</span>
  </button>
);

interface ControlBarProps {
  muted: boolean;
  cameraOn: boolean;
  showCameraPanel: boolean;
  showParticipants: boolean;
  showChat: boolean;
  showEmojiPicker: boolean;
  emojiPickerRef: React.RefObject<HTMLDivElement>;
  participantCount: number;
  isHost: boolean;
  isAuthenticated?: boolean;
  isCoHost?: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleCameraPanel: () => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  onToggleEmojiPicker: () => void;
  onEmojiReaction: (emoji: string) => void;
  onLeave: () => void;
  onChangeMovie?: () => void;
  onToggleHostControls?: () => void;
  emojiReactions: string[];
}

const ControlBar: React.FC<ControlBarProps> = ({
  muted,
  cameraOn,
  showCameraPanel,
  showParticipants,
  showChat,
  showEmojiPicker,
  emojiPickerRef,
  participantCount,
  isHost,
  isAuthenticated,
  isCoHost,
  onToggleMute,
  onToggleCamera,
  onToggleCameraPanel,
  onToggleParticipants,
  onToggleChat,
  onToggleEmojiPicker,
  onEmojiReaction,
  onLeave,
  onChangeMovie,
  onToggleHostControls,
  emojiReactions,
}) => {
  return (
    <div className="bg-black/80 backdrop-blur-sm border-t border-emerald-900/20 py-1 px-3">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-1 text-emerald-400">
          <Popcorn size={12} />
          <span className="text-xs font-medium">in cinema</span>
          <span className="text-xs font-semibold">{participantCount}</span>
        </div>

        <div className="flex items-center gap-1">
          <ControlButton
            active={muted}
            onClick={onToggleMute}
            icon={muted ? MicOff : Mic}
            text={muted ? "Unmute" : "Mute"}
          />
          <ControlButton
            active={!cameraOn}
            onClick={onToggleCamera}
            icon={cameraOn ? Video : VideoOff}
            text={cameraOn ? "Cam Off" : "Cam On"}
          />

          <div className="relative" ref={emojiPickerRef}>
            <ControlButton
              onClick={onToggleEmojiPicker}
              icon={Smile}
              text="React"
            />
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-emerald-500/30 rounded-lg shadow-2xl z-50 p-3 min-w-[200px]">
                <div className="grid grid-cols-5 gap-2">
                  {emojiReactions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onEmojiReaction(emoji);
                        onToggleEmojiPicker();
                      }}
                      className="text-2xl hover:scale-125 transition-transform duration-150 p-1 rounded hover:bg-emerald-600/20"
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Show Change Movie button for host or authenticated users */}
          {(isHost || isAuthenticated) && onChangeMovie && (
            <ControlButton
              onClick={onChangeMovie}
              icon={Film}
              text="Change Movie"
            />
          )}
          {/* Host Controls Button */}
          {(isHost || isCoHost) && onToggleHostControls && (
            <ControlButton
              onClick={onToggleHostControls}
              icon={Settings}
              text="Settings"
            />
          )}
          <ControlButton
            active={showCameraPanel}
            onClick={onToggleCameraPanel}
            icon={Video}
            text="Cameras"
          />
          <ControlButton
            active={showParticipants}
            onClick={onToggleParticipants}
            icon={Users}
            text="People"
          />
          <ControlButton
            active={showChat}
            onClick={onToggleChat}
            icon={MessageCircle}
            text="Chat"
          />
          <ControlButton
            onClick={onLeave}
            icon={LogOut}
            text="Leave"
            danger
          />
        </div>
      </div>
    </div>
  );
};

export default ControlBar;