import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Moon,
  Sun,
  Bell,
  Eye,
  Shield,
  UserX,
  Trash2,
  LogOut,
  Volume2,
  VolumeX,
  Check,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const { userProfile, updateProfileData, logout } = useAuth();

  const [notificationSound, setNotificationSound] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeenPrivacy, setLastSeenPrivacy] = useState<'everyone' | 'nobody'>('everyone');
  const [photoPrivacy, setPhotoPrivacy] = useState<'everyone' | 'nobody'>('everyone');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const handleUnblock = async (targetUid: string) => {
    if (!userProfile?.blockedUsers) return;
    const updated = userProfile.blockedUsers.filter((uid) => uid !== targetUid);
    await updateProfileData({ blockedUsers: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" /> Settings & Privacy
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Appearance Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Appearance
            </h3>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-purple-400" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    Dark Mode
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Toggle dark or light app color theme
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Notifications
            </h3>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {notificationSound ? (
                  <Volume2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    Message Tone & Audio
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Play notification audio ping on new message
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotificationSound(!notificationSound)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationSound ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationSound ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Privacy Controls
            </h3>

            {/* Read Receipts */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-sky-500" />
                <div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    Read Receipts
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    If turned off, you won't send or receive blue ticks
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReadReceipts(!readReceipts)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  readReceipts ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    readReceipts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Last Seen Privacy */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Who can see my Last Seen
              </span>
              <select
                value={lastSeenPrivacy}
                onChange={(e) => setLastSeenPrivacy(e.target.value as any)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="everyone">Everyone</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>
          </div>

          {/* Blocked Users Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Blocked Contacts ({userProfile?.blockedUsers?.length || 0})
            </h3>
            {userProfile?.blockedUsers && userProfile.blockedUsers.length > 0 ? (
              <div className="space-y-2">
                {userProfile.blockedUsers.map((bUid) => (
                  <div
                    key={bUid}
                    className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <UserX className="w-4 h-4 text-red-400" />
                      <span>UID: {bUid.substring(0, 10)}...</span>
                    </div>
                    <button
                      onClick={() => handleUnblock(bUid)}
                      className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic px-1">No blocked users.</div>
            )}
          </div>

          {/* Logout & Danger Zone */}
          <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={logout}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4 text-slate-500" /> Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
                                                    
