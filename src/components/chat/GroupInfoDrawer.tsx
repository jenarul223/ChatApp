import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Users,
  Shield,
  UserPlus,
  UserMinus,
  Crown,
  LogOut,
  Camera,
  Edit2,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface GroupInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroupInfoDrawer: React.FC<GroupInfoDrawerProps> = ({ isOpen, onClose }) => {
  const {
    activeChat,
    allUsers,
    updateGroupInfo,
    addGroupMembers,
    removeGroupMember,
    makeGroupAdmin,
    leaveGroup,
  } = useChat();
  const { currentUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(activeChat?.name || '');
  const [description, setDescription] = useState(activeChat?.description || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !activeChat || activeChat.type !== 'group') return null;

  const isAdmin = currentUser && activeChat.adminIds?.includes(currentUser.uid);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveInfo = async () => {
    setLoading(true);
    try {
      await updateGroupInfo(
        activeChat.id,
        name.trim() || activeChat.name || 'Group',
        description.trim(),
        photoFile
      );
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const nonMembers = allUsers.filter((u) => !activeChat.participants.includes(u.uid));

  const handleAddSelectedMembers = async () => {
    if (selectedToAdd.length === 0) return;
    setLoading(true);
    try {
      await addGroupMembers(activeChat.id, selectedToAdd);
      setShowAddMembers(false);
      setSelectedToAdd([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-80 h-full border-l border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 flex flex-col z-20 shadow-xl transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-500" /> Group Info
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 overflow-y-auto space-y-6">
        {/* Group Photo & Name */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500/20 shadow-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              {photoPreview || activeChat.groupImage ? (
                <img
                  src={photoPreview || activeChat.groupImage}
                  alt={activeChat.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-10 h-10 text-slate-400" />
              )}
            </div>
            {isAdmin && (
              <label className="absolute bottom-0 right-0 p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg cursor-pointer">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {editing ? (
            <div className="w-full space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 text-center text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Group description..."
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 text-center text-xs text-slate-600 dark:text-slate-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveInfo}
                disabled={loading}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" /> Save Info
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {activeChat.name}
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setName(activeChat.name || '');
                      setDescription(activeChat.description || '');
                      setEditing(true);
                    }}
                    className="text-slate-400 hover:text-emerald-500"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {activeChat.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {activeChat.description}
                </p>
              )}
              <span className="text-[11px] text-slate-400 mt-1 block">
                {activeChat.participants.length} members
              </span>
            </div>
          )}
        </div>

        {/* Group Members List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Group Members
            </h4>
            {isAdmin && (
              <button
                onClick={() => setShowAddMembers(!showAddMembers)}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add
              </button>
            )}
          </div>

          {/* Add Member Selection Panel */}
          {showAddMembers && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Add People to Group:
              </span>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {nonMembers.map((u) => {
                  const selected = selectedToAdd.includes(u.uid);
                  return (
                    <div
                      key={u.uid}
                      onClick={() =>
                        setSelectedToAdd((prev) =>
                          selected ? prev.filter((id) => id !== u.uid) : [...prev, u.uid]
                        )
                      }
                      className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer border ${
                        selected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{u.name}</span>
                      {selected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={handleAddSelectedMembers}
                disabled={selectedToAdd.length === 0 || loading}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
              >
                Confirm Add ({selectedToAdd.length})
              </button>
            </div>
          )}

          {/* Member List Rows */}
          <div className="space-y-2">
            {activeChat.participants.map((uid) => {
              const details = activeChat.participantDetails?.[uid];
              const isMemAdmin = activeChat.adminIds?.includes(uid);
              const isSelf = currentUser?.uid === uid;

              return (
                <div
                  key={uid}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <img
                      src={details?.photoURL || 'https://via.placeholder.com/40'}
                      alt={details?.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        {details?.name || 'Member'}
                        {isSelf && <span className="text-[10px] text-slate-400">(You)</span>}
                      </div>
                      <div className="text-[10px] text-slate-400">{details?.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isMemAdmin && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[10px] font-semibold rounded-md flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Admin
                      </span>
                    )}

                    {isAdmin && !isSelf && (
                      <div className="flex items-center gap-1">
                        {!isMemAdmin && (
                          <button
                            onClick={() => makeGroupAdmin(activeChat.id, uid)}
                            title="Make Group Admin"
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-amber-500"
                          >
                            <Crown className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => removeGroupMember(activeChat.id, uid)}
                          title="Remove Member"
                          className="p-1 hover:bg-red-500/10 rounded text-red-400"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Danger Action - Leave Group */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => leaveGroup(activeChat.id)}
            className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold text-xs rounded-xl border border-red-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Leave Group
          </button>
        </div>
      </div>
    </div>
  );
};
