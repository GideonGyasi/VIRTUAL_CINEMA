import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarPicker, { type AvatarOption } from './AvatarPicker';

interface HostControlPanelProps {
  isHost?: boolean;
  isCoHost?: boolean;
  sessionId: string;
  participants?: unknown[];
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onUpdateProfile: (data: { name?: string; email?: string; password?: string; avatar?: string }) => void;
  socketRef: React.RefObject<unknown>;
  currentUser?: { name?: string; email?: string; avatar?: string };
}

const HostControlPanel: React.FC<HostControlPanelProps> = ({

  isOpen,
  onClose,
  onLogout,
  onUpdateProfile,
  
  currentUser
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // This panel is now for all participants to edit their profile, not just host
  // Removed the host/cohost check so everyone can see their profile



  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-gradient-to-b from-black via-gray-900 to-black backdrop-blur-md border-l border-emerald-800/30 shadow-2xl z-[60] overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-emerald-400">Profile</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400">Name</label>
                  <input className="w-full p-2 bg-gray-900 border border-emerald-800 rounded mt-1 text-white" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Email</label>
                  <input className="w-full p-2 bg-gray-900 border border-emerald-800 rounded mt-1 text-white" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Change password</label>
                  <input type="password" className="w-full p-2 bg-gray-900 border border-emerald-800 rounded mt-1 text-white" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Profile avatar</label>
                  <button
                    onClick={() => setShowAvatarPicker(true)}
                    className="w-full mt-1 p-3 bg-gray-900 border border-emerald-800 rounded text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    {renderAvatarPreview(avatar)}
                    <span className="text-sm">Choose Avatar</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onUpdateProfile({ name, email, password, avatar }); }}
                    className="flex-1 px-4 py-2 bg-[#00bfa6] rounded font-semibold text-black"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => onLogout()}
                    className="px-4 py-2 bg-red-600 rounded text-white font-semibold"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {showAvatarPicker && (
        <AvatarPicker
          onSelect={handleAvatarSelect}
          onCancel={() => setShowAvatarPicker(false)}
          selectedId={getSelectedAvatarId(avatar)}
        />
      )}
    </>
  );

  // Helper: render avatar preview
  function renderAvatarPreview(avatarData?: string) {
    if (!avatarData) {
      return <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-xs text-white">?</div>;
    }
    
    try {
      const avatarOption = JSON.parse(avatarData) as AvatarOption;
      return (
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: avatarOption.bgColor, color: avatarOption.textColor }}
        >
          {avatarOption.emoji}
        </div>
      );
    } catch {
      return <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-xs text-white">A</div>;
    }
  }

  // Helper: get avatar ID from stored data
  function getSelectedAvatarId(avatarData?: string): string | undefined {
    if (!avatarData) return undefined;
    try {
      const avatarOption = JSON.parse(avatarData) as AvatarOption;
      return avatarOption.id;
    } catch {
      return undefined;
    }
  }

  // Handle avatar selection from picker
  function handleAvatarSelect(avatarOption: AvatarOption) {
    const avatarData = JSON.stringify(avatarOption);
    setAvatar(avatarData);
    setShowAvatarPicker(false);
  }
};

export default HostControlPanel;

