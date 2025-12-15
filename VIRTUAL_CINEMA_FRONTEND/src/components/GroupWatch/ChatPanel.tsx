import React, { useState, useRef, useEffect } from "react";
import { Send, Smile } from "lucide-react";
import type { ChatMessage, Participant } from "./types";

interface ChatPanelProps {
  messages: ChatMessage[];
  messageText: string;
  localUserId: string;
  participants?: Participant[];
  onMessageChange: (text: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

const EMOJI_LIST = ["😀","😂","👍","❤️","🎉","😮","😢","🔥","👏","😎"];

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  messageText,
  localUserId,
  participants = [],
  onMessageChange,
  onSendMessage,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowEmojiPicker(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, []);

  const findParticipant = (userId: string) => {
    const p = participants.find(p => p.id === userId);
    if (!p && userId) console.debug('[💬 CHAT] Participant not found for userId:', userId, 'Available:', participants.map(x => x.id));
    return p;
  };

  const handleSelectEmoji = (emoji: string) => {
    onMessageChange((messageText || '') + emoji);
    setShowEmojiPicker(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="w-80 bg-black/95 backdrop-blur-sm border-l border-emerald-900/20 flex flex-col">
      <div className="p-3 border-b border-emerald-900/20 bg-emerald-950/10 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-emerald-400">Chat</h3>
        <div className="text-xs text-gray-400">{messages.length} messages</div>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-3" id="chat-scroll">
        {messages.map((message) => {
          const isLocal = message.userId === localUserId;
          const participant = findParticipant(message.userId);
          let avatarNode = (
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-sm text-white">?</div>
          );
          if (participant?.avatar) {
            try {
              const av = JSON.parse(participant.avatar);
              if (av && av.emoji && av.bgColor) {
                avatarNode = (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: av.bgColor, color: av.textColor }}>{av.emoji}</div>
                );
              } else {
                // Avatar JSON is incomplete, show default
                avatarNode = (
                  <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-sm text-white">{message.name[0].toUpperCase()}</div>
                );
              }
            } catch (err) {
              console.log(err);
              // Fallback to URL image format (legacy)
              avatarNode = <img src={participant.avatar} className="w-8 h-8 rounded-full object-cover" alt="avatar" />;
            }
          }

          return (
            <div key={message.id} className={`flex items-start gap-2 ${isLocal ? 'justify-end' : 'justify-start'}`}>
              {!isLocal && <div className="flex-shrink-0">{avatarNode}</div>}
              <div className={`max-w-[72%] ${isLocal ? 'text-right' : 'text-left'}`}>
                <div className={`text-xs font-medium ${isLocal ? 'text-emerald-300' : 'text-emerald-200'}`}>
                  {message.name} <span className="text-[10px] text-gray-500 ml-2">{new Date(message.at).toLocaleTimeString()}</span>
                </div>
                <div className={`mt-1 px-3 py-2 rounded-md text-sm ${isLocal ? 'bg-emerald-900/20 ml-auto rounded-br-sm border-emerald-700/30' : 'bg-gray-900/30 mr-auto rounded-bl-sm border-gray-700/30'}`}>
                  <span className="break-words">{message.text}</span>
                </div>
              </div>
              {isLocal && <div className="flex-shrink-0">{avatarNode}</div>}
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t border-emerald-900/20 bg-emerald-950/5">
        <form onSubmit={onSendMessage} className="flex items-center gap-2">
          <button type="button" onClick={() => setShowEmojiPicker(s => !s)} className="p-2 bg-gray-900 rounded text-emerald-300">
            <Smile size={16} />
          </button>
          <input
            ref={inputRef}
            value={messageText}
            onChange={(e) => onMessageChange(e.target.value)}
            className="flex-1 rounded-md bg-gray-900 border border-emerald-900/10 px-3 py-2 outline-none text-sm text-white placeholder-gray-400"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors text-sm font-medium"
          >
            <Send size={14} />
          </button>
        </form>

        {showEmojiPicker && (
          <div className="mt-2 bg-gray-900 border border-emerald-800/20 rounded p-2 grid grid-cols-6 gap-2">
            {EMOJI_LIST.map(e => (
              <button key={e} type="button" onClick={() => handleSelectEmoji(e)} className="p-2 text-lg">
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;