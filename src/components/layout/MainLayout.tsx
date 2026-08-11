import React, { useState } from 'react';
import { SidebarHeader } from '../sidebar/SidebarHeader';
import { SearchBar } from '../sidebar/SearchBar';
import { ChatList } from '../sidebar/ChatList';
import { ChatWindow } from '../chat/ChatWindow';
import { UserProfileModal } from '../profile/UserProfileModal';
import { SettingsModal } from '../settings/SettingsModal';
import { NewChatModal } from '../sidebar/NewChatModal';
import { StatusModal } from '../status/StatusModal';
import { useChat } from '../../context/ChatContext';

export const MainLayout: React.FC = () => {
  const { activeChatId, selectChat } = useChat();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups' | 'archived'>('all');

  // Modals visibility state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-900 dark:bg-[#0f172a] font-sans select-none">
      {/* Container Frame */}
      <div className="flex-1 flex w-full h-full max-w-7xl mx-auto my-0 md:my-3 md:h-[calc(100vh-1.5rem)] md:rounded-2xl md:border md:border-slate-200 dark:md:border-slate-700/50 md:shadow-2xl overflow-hidden bg-white dark:bg-[#0b141a]">
        
        {/* Left Sidebar */}
        <div
          className={`w-full md:w-80 flex flex-col h-full border-r border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#1e293b] transition-colors ${
            activeChatId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <SidebarHeader
            onOpenNewChat={() => setIsNewChatOpen(true)}
            onOpenStatus={() => setIsStatusOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />

          <ChatList
            searchTerm={searchTerm}
            activeFilter={activeFilter}
            onOpenNewChat={() => setIsNewChatOpen(true)}
          />
        </div>

        {/* Right Chat Window Area (Full width on mobile if active chat selected, or flex-1 on desktop) */}
        <div
          className={`flex-1 flex flex-col h-full ${
            activeChatId ? 'flex' : 'hidden md:flex'
          }`}
        >
          <ChatWindow
            onBackToChatList={() => selectChat(null)}
            onOpenNewChat={() => setIsNewChatOpen(true)}
          />
        </div>
      </div>

      {/* Global Modals */}
      {isProfileOpen && (
        <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      )}

      {isSettingsOpen && (
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      )}

      {isNewChatOpen && (
        <NewChatModal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
      )}

      {isStatusOpen && (
        <StatusModal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} />
      )}
    </div>
  );
};
          
