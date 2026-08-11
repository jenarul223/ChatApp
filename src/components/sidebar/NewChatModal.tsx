import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';
import { X, Search, UserPlus, Users, Camera, Check, ArrowRight, Mail, UserCheck, AlertCircle } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { allUsers, startDirectChat, createGroupChat, searchUsersByEmail } = useChat();
  const { userProfile } = useAuth();

  const [mode, setMode] = useState<'email' | 'all' | 'group'>('email');
  const [emailSearchTerm, setEmailSearchTerm] = useState('');
  const [emailSearchResults, setEmailSearchResults] = useState<UserProfile[]>([]);
  const [isSearchingEmail, setIsSearchingEmail] = useState(false);
  const [searchedEmailTriggered, setSearchedEmailTriggered] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  // Group state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupImageFile, setGroupImageFile] = useState<File | null>(null);
  const [groupImagePreview, setGroupImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearchEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSearchTerm.trim()) return;
    setIsSearchingEmail(true);
    setSearchedEmailTriggered(true);
    try {
      const results = await searchUsersByEmail(emailSearchTerm);
      const filtered = results.filter((u) => u.uid !== userProfile?.uid);
      setEmailSearchResults(filtered);
    } catch (err) {
      console.error('Email search error:', err);
    } finally {
      setIsSearchingEmail(false);
    }
  };

  const handleLiveEmailChange = (val: string) => {
    setEmailSearchTerm(val);
    setSearchedEmailTriggered(false);

    const term = val.trim().toLowerCase();
    if (!term) {
      setEmailSearchResults([]);
      return;
    }

    // Only show live suggestions if full exact email is typed or matches email structure
    const isFullEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(term);
    const exactMatch = allUsers.filter(
      (u) => u.uid !== userProfile?.uid && u.email.toLowerCase() === term
    );

    if (exactMatch.length > 0) {
      setEmailSearchResults(exactMatch);
      setSearchedEmailTriggered(true);
    } else if (isFullEmail) {
      searchUsersByEmail(term).then((results) => {
        const filtered = results.filter((u) => u.uid !== userProfile?.uid);
        setEmailSearchResults(filtered);
        setSearchedEmailTriggered(true);
      });
    } else {
      // Hide suggestions until full email address is entered
      setEmailSearchResults([]);
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    if (userProfile?.blockedUsers?.includes(u.uid)) return false;
    const term = searchTerm.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  const handleStartDirect = async (user: UserProfile) => {
    try {
      await startDirectChat(user);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMemberSelect = (uid: string) => {
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleGroupPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGroupImageFile(file);
      setGroupImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMembers.length === 0) return;

    setLoading(true);
    try {
      await createGroupChat(groupName.trim(), groupDescription.trim(), selectedMembers, groupImageFile);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
        {/* Header Tabs */}
        <div className="flex items-center justify-between px-5 py-4 bg-emerald-600 dark:bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('email')}
              className={`text-xs font-semibold flex items-center gap-1 py-1 px-2.5 rounded-lg transition-all ${
                mode === 'email'
                  ? 'bg-white/20 text-white shadow'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Search by Email
            </button>
            <button
              onClick={() => setMode('all')}
              className={`text-xs font-semibold flex items-center gap-1 py-1 px-2.5 rounded-lg transition-all ${
                mode === 'all'
                  ? 'bg-white/20 text-white shadow'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> All Contacts
            </button>
            <button
              onClick={() => setMode('group')}
              className={`text-xs font-semibold flex items-center gap-1 py-1 px-2.5 rounded-lg transition-all ${
                mode === 'group'
                  ? 'bg-white/20 text-white shadow'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Group
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {mode === 'email' ? (
            /* Search by Email Mode */
            <div className="space-y-4">
              <form onSubmit={handleSearchEmailSubmit} className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-emerald-500" />
                  Search User by Email ID
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={emailSearchTerm}
                      onChange={(e) => handleLiveEmailChange(e.target.value)}
                      placeholder="e.g. user@gmail.com"
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingEmail || !emailSearchTerm.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {isSearchingEmail ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" /> Search
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Enter the user's email address to locate them and add them directly to your contact list.
                </p>
              </form>

              {/* Email Search Results */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                {emailSearchResults.length > 0 ? (
                  emailSearchResults.map((u) => (
                    <div
                      key={u.uid}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={u.photoURL}
                            alt={u.name}
                            className="w-11 h-11 rounded-full object-cover border border-slate-300 dark:border-slate-600"
                          />
                          {u.online && (
                            <span className="w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full absolute bottom-0 right-0" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {u.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-emerald-500" /> {u.email}
                          </div>
                          {u.about && (
                            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              {u.about}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartDirect(u)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow transition-all flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Add & Chat
                      </button>
                    </div>
                  ))
                ) : emailSearchTerm.trim() && searchedEmailTriggered && !isSearchingEmail ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-1">
                    <div className="flex items-center justify-center text-amber-500 gap-1.5 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      No user found with email "{emailSearchTerm}"
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Ensure the email address is spelled correctly and that the user has created a WhatsApp Web account.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center gap-2">
                    <Mail className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span>Type an email ID above to find contacts instantly</span>
                  </div>
                )}
              </div>
            </div>
          ) : mode === 'all' ? (
            <>
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search contacts by name or email..."
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* User List */}
              <div className="space-y-1.5 pt-1">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <div
                      key={u.uid}
                      onClick={() => handleStartDirect(u)}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={u.photoURL}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                          />
                          {u.online && (
                            <span className="w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full absolute bottom-0 right-0" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {u.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {u.email}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                        Chat
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No contacts found.
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Group Creation Form */
            <form onSubmit={handleCreateGroup} className="space-y-4">
              {/* Group Photo */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    {groupImagePreview ? (
                      <img src={groupImagePreview} alt="Group" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full cursor-pointer shadow-md">
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGroupPhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <span className="text-[11px] text-slate-400 mt-1">Group Icon (optional)</span>
              </div>

              {/* Group Name & Description */}
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group Name *"
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Group Description (optional)"
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Select Members Header */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Select Members ({selectedMembers.length})
                </label>
                <div className="space-y-1.5 mt-2 max-h-48 overflow-y-auto">
                  {allUsers.map((u) => {
                    const isSelected = selectedMembers.includes(u.uid);
                    return (
                      <div
                        key={u.uid}
                        onClick={() => toggleMemberSelect(u.uid)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50'
                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.photoURL}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                              {u.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {u.email}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !groupName.trim() || selectedMembers.length === 0}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Group <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

