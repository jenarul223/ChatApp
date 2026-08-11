import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { formatLastSeen } from '../../utils/helpers';
import {
  Phone,
  Video,
  Search,
  FolderOpen,
  MoreVertical,
  Users,
  ArrowLeft,
  Info,
  Trash2,
  RotateCcw,
  UserX,
} from 'lucide-react';

interface ChatHeaderProps {
  onToggleMediaGallery: () => void;
  onToggleGroupInfo: () => void;
  onBackToChatList: () => void; // Mobile back button
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onToggleMediaGallery,
  onToggleGroupInfo,
  onBackToChatList,
}) => {
  const { activeChat, allUsers, clearChat, deleteChat } = useChat();
  const { currentUser, userProfile, updateProfileData } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!activeChat || !currentUser) return null;

  let title = activeChat.name || 'Chat';
  let photoURL = activeChat.groupImage || '';
  let subtitle = '';

  if (activeChat.type === 'direct') {
    const otherUid = activeChat.participants.find((id) => id !== currentUser.uid);
    const otherUser = allUsers.find((u) => u.uid === otherUid);

    if (otherUser) {
      title = otherUser.name;
      photoURL = otherUser.photoURL;

      // Typing or Recording state priority
      if (activeChat.typing?.[otherUid]) {
        subtitle = 'typing...';
      } else if (activeChat.recording?.[otherUid]) {
        subtitle = 'recording audio...';
      } else {
        subtitle = formatLastSeen(otherUser.lastSeen, otherUser.online);
      }
    } else if (activeChat.participantDetails && otherUid) {
      const details = activeChat.participantDetails[otherUid];
      title = details?.name || 'User';
      photoURL = details?.photoURL || '';
      subtitle = 'offline';
    }
  } else {
    // Group chat subtitle
    if (
      activeChat.typing &&
      Object.entries(activeChat.typing).some(([uid, isT]) => uid !== currentUser.uid && isT)
    ) {
      subtitle = 'someone is typing...';
    } else {
      subtitle = `${activeChat.participants.length} group members`;
    }
  }

  const otherUid = activeChat.type === 'direct'
    ? activeChat.participants.find((id) => id !== currentUser.uid)
    : null;
  const isBlocked = otherUid && userProfile?.blockedUsers?.includes(otherUid);

  const handleToggleBlock = async () => {
    if (!otherUid || !userProfile) return;
    const current = userProfile.blockedUsers || [];
    const updated = isBlocked
      ? current.filter((uid) => uid !== otherUid)
      : [...current, otherUid];
    await updateProfileData({ blockedUsers: updated });
    setShowMenu(false);
  };

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-100/90 dark:bg-[#1e293b]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/50 transition-colors z-10">
      <div className="flex items-center gap-3 truncate">
        {/* Mobile Back Arrow */}
        <button
          onClick={onBackToChatList}
          className="md:hidden p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Chat Header Avatar & Info */}
        <div
          onClick={activeChat.type === 'group' ? onToggleGroupInfo : undefined}
          className={`flex items-center gap-3 truncate ${
            activeChat.type === 'group' ? 'cursor-pointer hover:opacity-90' : ''
          }`}
        >
          <div className="relative flex-shrink-0">
            {activeChat.type === 'group' ? (
              photoURL ? (
                <img
                  src={photoURL}
                  alt={title}
                  className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                  <Users className="w-5 h-5" />
                </div>
              )
            ) : (
              <img
                src={photoURL || 'https://via.placeholder.com/40'}
                alt={title}
                className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700"
              />
            )}
          </div>

          <div className="truncate">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
              {title}
              {activeChat.type === 'group' && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-medium">
                  Group
                </span>
              )}
            </h3>
            <p
              className={`text-xs truncate ${
                subtitle.includes('typing') || subtitle === 'online'
                  ? 'text-emerald-500 font-medium'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
        <button
          onClick={onToggleMediaGallery}
          title="Media, Docs & Starred"
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:text-emerald-500"
        >
          <FolderOpen className="w-5 h-5" />
        </button>

        {activeChat.type === 'group' && (
          <button
            onClick={onToggleGroupInfo}
            title="Group Info"
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:text-emerald-500"
          >
            <Info className="w-5 h-5" />
          </button>
        )}

        {/* Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:text-emerald-500"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 z-30 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 text-xs text-slate-700 dark:text-slate-200">
              {activeChat.type === 'direct' && otherUid && (
                <button
                  onClick={handleToggleBlock}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <UserX className="w-4 h-4 text-red-400" />
                  <span>{isBlocked ? 'Unblock User' : 'Block User'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  clearChat(activeChat.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-amber-500 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear Messages</span>
              </button>

              <button
                onClick={() => {
                  deleteChat(activeChat.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-500 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Chat</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
        
