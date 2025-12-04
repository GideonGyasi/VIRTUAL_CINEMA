import React from "react";
import { Send } from "lucide-react";
import type { ChatMessage } from "./types";

interface ChatPanelProps {
  messages: ChatMessage[];
  messageText: string;
  localUserId: string;
  onMessageChange: (text: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  messageText,
  localUserId,
  onMessageChange,
  onSendMessage,
}) => {
  return (
    <div className="w-72 bg-black/90 backdrop-blur-sm border-l border-emerald-900/20 flex flex-col">
      <div className="p-2 border-b border-emerald-900/20 bg-emerald-950/10">
        <h3 className="font-semibold text-xs text-emerald-400">Chat</h3>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-2 rounded-md max-w-[90%] border text-xs ${
              message.userId === localUserId
                ? "bg-emerald-900/20 ml-auto rounded-br-sm border-emerald-700/30"
                : "bg-gray-900/30 mr-auto rounded-bl-sm border-gray-700/30"
            }`}
          >
            <div className="text-[10px] text-emerald-300 mb-0.5 font-medium">{message.name}</div>
            <div className="text-xs text-white">{message.text}</div>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-emerald-900/20 bg-emerald-950/10">
        <form onSubmit={onSendMessage} className="flex gap-1">
          <input
            value={messageText}
            onChange={(e) => onMessageChange(e.target.value)}
            className="flex-1 rounded-md bg-gray-900 border border-emerald-900/20 px-2 py-1 outline-none text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors border border-emerald-500/20"
          >
            <Send size={12} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;