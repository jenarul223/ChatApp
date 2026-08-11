import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Camera, User, Info, Mail, Calendar, Check, Edit2 } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, updateProfileData } = useAuth();
  const [name, setName] = useState(userProfile?.name || '');
  const [about, setAbout] = useState(userProfile?.about || '');
  const [editingName, setEditingName] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !userProfile) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfileData(
        {
          name: name.trim() || userProfile.name,
          about: about.trim() || userProfile.about,
        },
        photoFile
      );
      setEditingName(false);
      setEditingAbout(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Recently';
    return date.toLocaleDateString([], { month: 'long', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-600 dark:bg-emerald-700 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5" /> Profile
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-emerald-500/20 shadow-lg bg-slate-100 dark:bg-slate-700">
                <img
                  src={photoPreview || userProfile.photoURL}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <label className="absolute bottom-1 right-1 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg cursor-pointer transition-colors">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Click camera icon to change photo
            </span>
          </div>

          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Your Name
            </label>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              {editingName ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-100 font-medium focus:outline-none w-full"
                  autoFocus
                />
              ) : (
                <span className="text-slate-800 dark:text-slate-100 font-medium">
                  {name}
                </span>
              )}
              <button
                type="button"
                onClick={() => setEditingName(!editingName)}
                className="text-slate-400 hover:text-emerald-500 transition-colors ml-2"
              >
                {editingName ? <Check className="w-4 h-4 text-emerald-500" /> : <Edit2 className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[11px] text-slate-400 px-1">
              This is not your username or pin. This name will be visible to your contacts.
            </span>
          </div>

          {/* About Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              About / Bio
            </label>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              {editingAbout ? (
                <input
                  type="text"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-100 text-sm focus:outline-none w-full"
                  autoFocus
                />
              ) : (
                <span className="text-slate-700 dark:text-slate-300 text-sm">
                  {about}
                </span>
              )}
              <button
                type="button"
                onClick={() => setEditingAbout(!editingAbout)}
                className="text-slate-400 hover:text-emerald-500 transition-colors ml-2"
              >
                {editingAbout ? <Check className="w-4 h-4 text-emerald-500" /> : <Edit2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Readonly Details */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{userProfile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Joined {formatDate(userProfile.createdAt)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
                  
