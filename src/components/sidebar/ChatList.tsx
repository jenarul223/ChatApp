import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { ChatListItem } from './ChatListItem';
import { Pin, MessageSquare, Mail, UserPlus, Users } from 'lucide-react';
import { UserProfile } from '../../types';

interface ChatListProps {
  searchTerm: string;
  activeFilter: 'all' | 'unread' | 'groups' | 'archived';
  onOpenNewChat: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  searchTerm,
  activeFilter,
  onOpenNewChat,
}) => {
  const { chats, activeChatId, selectChat, loadingChats, allUsers, startDirectChat } = useChat();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  if (loadingChats) {
    return (
      <div className="flex-1 p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex items-center gap-3 animate-pulse">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Filter existing chats
  let filtered = chats.filter((c) => {
    const isArchived = !!c.archived?.[currentUser.uid];

    if (activeFilter === 'archived') {
      if (!isArchived) return false;
    } else {
      if (isArchived) return false; // Hide archived from standard lists
    }

    if (activeFilter === 'unread') {
      const count = c.unreadCount?.[currentUser.uid] || 0;
      if (count === 0) return false;
    }

    if (activeFilter === 'groups') {
      if (c.type !== 'group') return false;
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      let name = c.name || '';
      let email = '';
      if (c.type === 'direct') {
        const otherUid = c.participants.find((id) => id !== currentUser.uid);
        const otherUser = allUsers.find((u) => u.uid === otherUid);
        if (otherUser) {
          name = otherUser.name;
          email = otherUser.email;
        }
      }
      const lastText = c.lastMessage?.text || '';
      return (
        name.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        lastText.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Also check non-chat users matching search term (e.g. searching email id)
  let matchingGlobalUsers: UserProfile[] = [];
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    const isFullEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(term);

    // UIDs already in existing direct chats
    const existingChatUserUids = new Set(
      chats
        .filter((c) => c.type === 'direct')
        .flatMap((c) => c.participants)
    );

    matchingGlobalUsers = allUsers.filter((u) => {
      if (u.uid === currentUser.uid) return false;
      if (existingChatUserUids.has(u.uid)) return false; // already in chat list
      const uEmail = u.email.toLowerCase();
      const uName = u.name.toLowerCase();
      if (isFullEmail) {
        return uEmail === term;
      }
      return uEmail === term || uName === term;
    });
  }

  const pinnedChats = filtered.filter((c) => c.pinned?.[currentUser.uid]);
  const otherChats = filtered.filter((c) => !c.pinned?.[currentUser.uid]);

  // First time login empty state (no chats exist at all)
  if (chats.length === 0 && !searchTerm.trim()) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shadow-lg">
          <UserPlus className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Your Chat List is Empty
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
            Search for contacts by their email address to start your first conversation!
          </p>
        </div>
        <button
          onClick={onOpenNewChat}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <Mail className="w-4 h-4" /> Add Contact by Email
        </button>
      </div>
    );
  }

  // Search returned 0 chats and 0 global users
  if (filtered.length === 0 && matchingGlobalUsers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No matches found
        </div>
        <p className="text-xs text-slate-400 max-w-xs">
          No existing chats or registered users found for "{searchTerm}".
        </p>
        <button
          onClick={onOpenNewChat}
          className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center gap-1.5"
        >
          <Mail className="w-3.5 h-3.5" /> Search Email ID
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Pinned Section */}
      {pinnedChats.length > 0 && (
        <div>
          <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-900/40 flex items-center gap-1.5">
            <Pin className="w-3 h-3 rotate-45" /> Pinned Chats
          </div>
          {pinnedChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeChatId}
              onSelect={() => selectChat(chat.id)}
            />
          ))}
        </div>
      )}

      {/* Other Chats Section */}
      <div>
        {pinnedChats.length > 0 && otherChats.length > 0 && (
          <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-900/40">
            All Messages
          </div>
        )}
        {otherChats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isActive={chat.id === activeChatId}
            onSelect={() => selectChat(chat.id)}
          />
        ))}
      </div>

      {/* Matching Global Users Section (Search by email/name for non-contacts) */}
      {matchingGlobalUsers.length > 0 && (
        <div className="mt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-900/40 flex items-center gap-1.5">
            <Mail className="w-3 h-3" /> New Contacts Found by Email ({matchingGlobalUsers.length})
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {matchingGlobalUsers.map((u) => (
              <div
                key={u.uid}
                onClick={() => startDirectChat(u)}
                className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={u.photoURL}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    {u.online && (
                      <span className="w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full absolute bottom-0 right-0" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {u.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {u.email}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 rounded-lg shadow-sm transition-all flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" /> Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

        
