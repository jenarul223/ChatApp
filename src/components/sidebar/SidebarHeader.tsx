import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  MessageSquarePlus,
  CircleDot,
  Settings,
  Moon,
  Sun,
  LogOut,
  User,
} from 'lucide-react';

interface SidebarHeaderProps {
  onOpenNewChat: () => void;
  onOpenStatus: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  onOpenNewChat,
  onOpenStatus,
  onOpenProfile,
  onOpenSettings,
}) => {
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-700/50 transition-colors">
      {/* Current User Profile Avatar & Name */}
      <div
        onClick={onOpenProfile}
        className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
      >
        <div className="relative">
          <img
            src={userProfile?.photoURL || 'https://via.placeholder.com/40'}
            alt={userProfile?.name}
            className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700 shadow-sm"
          />
          <span className="w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full absolute bottom-0 right-0" />
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-500 transition-colors truncate max-w-[120px]">
            {userProfile?.name}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Available</div>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
        {/* Status / Stories */}
        <button
          onClick={onOpenStatus}
          title="Status Updates"
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:text-emerald-500"
        >
          <CircleDot className="w-5 h-5" />
        </button>

        {/* New Chat / Group */}
        <button
          onClick={onOpenNewChat}
          title="New Chat or Group"
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:text-emerald-500"
        >
          <MessageSquarePlus className="w-5 h-5" />
        </button>

        {/* Dark/Light Mode Switch */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-purple-600" />
          )}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Settings & Privacy"
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:text-emerald-500"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          title="Log Out"
          className="p-2 rounded-full hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
