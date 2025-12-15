import React, { useState } from 'react';

interface AvatarOption {
  id: string;
  label: string;
  emoji: string;
  bgColor: string;
  textColor: string;
}

const AVATAR_PRESETS: AvatarOption[] = [
  { id: '1', label: 'Yellow Ghost', emoji: '👻', bgColor: '#FFD700', textColor: '#000' },
  { id: '2', label: 'Red Demon', emoji: '😈', bgColor: '#FF4444', textColor: '#fff' },
  { id: '3', label: 'Blue Dragon', emoji: '🐉', bgColor: '#4169E1', textColor: '#fff' },
  { id: '4', label: 'Green Alien', emoji: '👽', bgColor: '#32CD32', textColor: '#000' },
  { id: '5', label: 'Purple Wizard', emoji: '🧙', bgColor: '#9932CC', textColor: '#fff' },
  { id: '6', label: 'Orange Tiger', emoji: '🐯', bgColor: '#FF8C00', textColor: '#000' },
  { id: '7', label: 'Pink Unicorn', emoji: '🦄', bgColor: '#FF69B4', textColor: '#fff' },
  { id: '8', label: 'Cyan Robot', emoji: '🤖', bgColor: '#00CED1', textColor: '#000' },
  { id: '9', label: 'Brown Bear', emoji: '🐻', bgColor: '#8B4513', textColor: '#fff' },
  { id: '10', label: 'Gray Astronaut', emoji: '👨‍🚀', bgColor: '#808080', textColor: '#fff' },
  { id: '11', label: 'Lime Turtle', emoji: '🐢', bgColor: '#ADFF2F', textColor: '#000' },
  { id: '12', label: 'Navy Penguin', emoji: '🐧', bgColor: '#000080', textColor: '#fff' },
];

interface AvatarPickerProps {
  onSelect: (avatar: AvatarOption) => void;
  onCancel: () => void;
  selectedId?: string;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({ onSelect, onCancel, selectedId }) => {
  const [selected, setSelected] = useState<string | undefined>(selectedId || AVATAR_PRESETS[0].id);

  const handleConfirm = () => {
    const avatarOption = AVATAR_PRESETS.find(a => a.id === selected);
    if (avatarOption) {
      onSelect(avatarOption);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#0b0b0b] rounded-lg border border-emerald-900/30 p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Choose Your Avatar</h3>
        
        <div className="grid grid-cols-3 gap-3 mb-6 max-h-96 overflow-y-auto">
          {AVATAR_PRESETS.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setSelected(avatar.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                selected === avatar.id
                  ? 'border-emerald-400 bg-emerald-950/30'
                  : 'border-gray-700 bg-gray-900/20 hover:bg-gray-900/40'
              }`}
              title={avatar.label}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: avatar.bgColor, color: avatar.textColor }}
              >
                {avatar.emoji}
              </div>
              <span className="text-xs text-gray-300 text-center line-clamp-2">
                {avatar.label}
              </span>
            </button>
          ))}
        </div>

        {/* Preview */}
        {selected && (
          <div className="mb-6 flex justify-center">
            <div>
              <p className="text-xs text-gray-400 text-center mb-2">Preview:</p>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold border-2 border-emerald-400"
                style={{
                  backgroundColor: AVATAR_PRESETS.find(a => a.id === selected)?.bgColor,
                  color: AVATAR_PRESETS.find(a => a.id === selected)?.textColor
                }}
              >
                {AVATAR_PRESETS.find(a => a.id === selected)?.emoji}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-800 text-sm text-white hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded bg-emerald-600 text-sm text-black font-semibold hover:bg-emerald-500 transition-colors"
          >
            Select Avatar
          </button>
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { AVATAR_PRESETS };
export type { AvatarOption };
export default AvatarPicker;
