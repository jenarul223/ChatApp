import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { ChatItem } from '../../types';
import { formatTime } from '../../utils/helpers';
import {
  Pin,
  VolumeX,
  Archive,
  MoreVertical,
  Users,
  Check,
  CheckCheck,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface ChatListItemProps {
  chat: ChatItem;
  isActive: boolean;
  onSelect: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({ chat, isActive, onSelect }) => {
  const { currentUser } = useAuth();
  const {
    allUsers,
    togglePinChat,
    toggleArchiveChat,
    toggleMuteChat,
    clearChat,
    deleteChat,
  } = useChat();

  const [showMenu, setShowMenu] = useState(false);

  if (!currentUser) return null;

  // Determine chat display info (direct vs group)
  let title = chat.name || 'Chat';
  let photoURL = chat.groupImage || '';
  let onlineStatus = false;
  let typingText = '';

  if (chat.type === 'direct') {
    const otherUid = chat.participants.find((id) => id !== currentUser.uid);
    const otherUser = allUsers.find((u) => u.uid === otherUid);

    if (otherUser) {
      title = otherUser.name;
      photoURL = otherUser.photoURL;
      onlineStatus = otherUser.online;
    } else if (chat.participantDetails && otherUid) {
      const details = chat.participantDetails[otherUid];
      title = details?.name || 'User';
      photoURL = details?.photoURL || '';
    }
  }

  // Check if typing/recording
  if (chat.typing && Object.entries(chat.typing).some(([uid, isT]) => uid !== currentUser.uid && isT)) {
    typingText = 'typing...';
  } else if (chat.recording && Object.entries(chat.recording).some(([uid, isR]) => uid !== currentUser.uid && isR)) {
    typingText = 'recording audio...';
  }

  const isPinned = !!chat.pinned?.[currentUser.uid];
  const isArchived = !!chat.archived?.[currentUser.uid];
  const isMuted = !!chat.muted?.[currentUser.uid];
  const unreadCount = chat.unreadCount?.[currentUser.uid] || 0;

  const lastMsg = chat.lastMessage;

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between p-3 cursor-pointer border-b border-slate-100 dark:border-slate-800/60 transition-all ${
        isActive
          ? 'bg-slate-200/90 dark:bg-slate-700/40 border-l-4 border-l-emerald-500 pl-2.5'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 border-l-4 border-l-transparent'
      }`}
    >
      <div className="flex items-center gap-3 truncate pr-2">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {chat.type === 'group' ? (
            photoURL ? (
              <img
                src={photoURL}
                alt={title}
                className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-600/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                <Users className="w-6 h-6" />
              </div>
            )
          ) : (
            <>
              <img
                src={photoURL || 'https://via.placeholder.com/48'}
                alt={title}
                className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              {onlineStatus && (
                <span className="w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full absolute bottom-0 right-0" />
              )}
            </>
          )}
        </div>

        {/* Text Details */}
        <div className="truncate flex-1">
          <div className="flex justify-between items-center mb-0.5">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {title}
            </h4>
            {lastMsg?.createdAt && (
              <span className="text-[11px] font-medium text-slate-400 flex-shrink-0 ml-1">
                {formatTime(lastMsg.createdAt)}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center text-xs">
            {typingText ? (
              <span className="text-emerald-500 font-semibold italic animate-pulse">
                {typingText}
              </span>
            ) : lastMsg ? (
              <div className="text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                {lastMsg.senderId === currentUser.uid && (
                  <span className="text-emerald-500">
                    {lastMsg.seen ? (
                      <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" />
                    ) : (
                      <Check className="w-3.5 h-3.5 inline" />
                    )}
                  </span>
                )}
                <span className="truncate">{lastMsg.text}</span>
              </div>
            ) : (
              <span className="text-slate-400 italic text-[11px]">No messages yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Badges & Icons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isMuted && <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
        {isPinned && <Pin className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500 rotate-45" />}
        {unreadCount > 0 && (
          <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[11px] font-bold rounded-full min-w-[20px] text-center shadow-sm">
            {unreadCount}
          </span>
        )}

        {/* Action Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-400 transition-opacity"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Context Action Menu Dropdown */}
      {showMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-3 top-10 z-30 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 text-xs text-slate-700 dark:text-slate-200"
        >
          <button
            onClick={() => {
              togglePinChat(chat.id);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <Pin className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isPinned ? 'Unpin Chat' : 'Pin Chat'}</span>
          </button>
          <button
            onClick={() => {
              toggleArchiveChat(chat.id);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <Archive className="w-3.5 h-3.5 text-sky-500" />
            <span>{isArchived ? 'Unarchive' : 'Archive Chat'}</span>
          </button>
          <button
            onClick={() => {
              toggleMuteChat(chat.id);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <VolumeX className="w-3.5 h-3.5 text-purple-500" />
            <span>{isMuted ? 'Unmute' : 'Mute Chat'}</span>
          </button>

          <div className="my-1 border-t border-slate-200 dark:border-slate-700" />

          <button
            onClick={() => {
              clearChat(chat.id);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-amber-500 flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
          <button
            onClick={() => {
              deleteChat(chat.id);
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-500 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Chat</span>
          </button>
        </div>
      )}
    </div>
  );
};
