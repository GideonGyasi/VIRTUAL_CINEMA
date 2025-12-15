import React from "react";
import { Film, Share2, Settings } from "lucide-react";

interface HeaderProps {
  movieTitle?: string;
  movieYear?: number;
  sessionId: string;
  isHost: boolean;
  copied: boolean;
  onCopyLink: () => void;
  onSettingsClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  movieTitle,
  movieYear,
  sessionId,
  copied,
  onCopyLink,
  onSettingsClick,
}) => {
  return (
    <header className="flex justify-between items-center px-4 py-1 bg-black/80 backdrop-blur-sm border-b border-emerald-800/20">
      <div className="flex items-center gap-2">
        <Film className="text-emerald-400" size={16} />
        <div>
          <h2 className="font-medium text-xs text-white truncate max-w-[200px]">
            {movieTitle || 'Movie'}
            {movieYear && ` (${movieYear})`}
          </h2>
          <span className="text-[10px] text-emerald-400">Session: {sessionId}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onSettingsClick}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-[10px] font-medium border border-blue-500/20 transition-colors"
          title="Profile Settings"
        >
          <Settings size={12} />
          Profile
        </button>
        <button 
          onClick={onCopyLink}
          className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[10px] font-medium border border-emerald-500/20 transition-colors"
        >
          <Share2 size={12} />
          {copied ? "Copied!" : "Invite"}
        </button>
      </div>
    </header>
  );
};

export default Header;