import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { MediaGalleryDrawer } from './MediaGalleryDrawer';
import { GroupInfoDrawer } from './GroupInfoDrawer';
import { MessageSquare, ShieldCheck, Laptop, Mail, UserPlus } from 'lucide-react';

interface ChatWindowProps {
  onBackToChatList: () => void;
  onOpenNewChat?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onBackToChatList, onOpenNewChat }) => {
  const { activeChat } = useChat();
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  if (!activeChat) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 text-center transition-colors border-l border-slate-200 dark:border-slate-800">
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 border border-emerald-500/20 shadow-inner">
          <MessageSquare className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          WhatsApp Web
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-2 leading-relaxed">
          Send and receive messages in real-time with instant sync, audio voice notes, media gallery, group chats, and stories.
        </p>

        {onOpenNewChat && (
          <button
            onClick={onOpenNewChat}
            className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 text-xs"
          >
            <Mail className="w-4 h-4" /> Search Contact by Email ID
          </button>
        )}

        <div className="mt-8 flex items-center gap-2 text-xs text-slate-400 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>End-to-end encrypted Firestore persistence</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full relative overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors">
      {/* Main Chat Area Column */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <ChatHeader
          onToggleMediaGallery={() => {
            setShowMediaGallery(!showMediaGallery);
            setShowGroupInfo(false);
          }}
          onToggleGroupInfo={() => {
            setShowGroupInfo(!showGroupInfo);
            setShowMediaGallery(false);
          }}
          onBackToChatList={onBackToChatList}
        />

        <MessageList onSetReply={() => {}} />

        <MessageInput />
      </div>

      {/* Side Drawers */}
      {showMediaGallery && (
        <MediaGalleryDrawer
          isOpen={showMediaGallery}
          onClose={() => setShowMediaGallery(false)}
        />
      )}

      {showGroupInfo && (
        <GroupInfoDrawer
          isOpen={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
        />
      )}
    </div>
  );
};
