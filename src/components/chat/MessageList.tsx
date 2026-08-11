import React, { useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { MessageItem } from './MessageItem';
import { formatDateSeparator } from '../../utils/helpers';
import { MessageReplyInfo } from '../../types';

interface MessageListProps {
  onSetReply: (reply: MessageReplyInfo) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ onSetReply }) => {
  const { messages, loadingMessages, activeChat, allUsers } = useChat();
  const { currentUser } = useAuth();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Detect typing state of the other participant(s)
  let typingUser: { name: string; photoURL?: string } | null = null;
  if (activeChat && currentUser && activeChat.typing) {
    const typingUid = Object.keys(activeChat.typing).find(
      (uid) => uid !== currentUser.uid && activeChat.typing?.[uid]
    );
    if (typingUid) {
      const u = allUsers.find((user) => user.uid === typingUid);
      if (u) {
        typingUser = { name: u.name, photoURL: u.photoURL };
      } else if (activeChat.participantDetails?.[typingUid]) {
        const details = activeChat.participantDetails[typingUid];
        typingUser = { name: details.name, photoURL: details.photoURL };
      } else {
        typingUser = { name: 'User' };
      }
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  if (loadingMessages) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Group messages by Date Separator
  let lastDateStr = '';

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-1 bg-slate-100/60 dark:bg-[#0b141a] transition-colors">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
          <div className="bg-emerald-500/10 text-emerald-500 font-semibold px-4 py-2 rounded-xl text-xs border border-emerald-500/20">
            🔒 End-to-end encrypted messaging
          </div>
          <p className="text-xs text-slate-400">
            Send a message to start the conversation!
          </p>
        </div>
      ) : (
        messages.map((msg) => {
          const dateStr = formatDateSeparator(msg.createdAt);
          const showDateDivider = dateStr !== lastDateStr;
          if (showDateDivider) {
            lastDateStr = dateStr;
          }

          return (
            <React.Fragment key={msg.id}>
              {showDateDivider && (
                <div className="flex justify-center my-3">
                  <span className="px-3 py-1 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] font-semibold text-slate-500 dark:text-slate-400 shadow-xs backdrop-blur-xs">
                    {dateStr}
                  </span>
                </div>
              )}
              <MessageItem
                message={msg}
                isGroup={activeChat?.type === 'group'}
                onSetReply={onSetReply}
              />
            </React.Fragment>
          );
        })
      )}

      {/* Typing indicator bubble */}
      {typingUser && (
        <div className="flex items-center gap-2 my-2 pl-1 transition-all animate-fade-in">
          {typingUser.photoURL && (
            <img
              src={typingUser.photoURL}
              alt={typingUser.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
            />
          )}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-2xl rounded-tl-xs text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-xs">
            <span>{typingUser.name} is typing</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
