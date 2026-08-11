import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { UserStatusStory } from '../../types';
import { Plus, X, CircleDot } from 'lucide-react';
import { CreateStatusModal } from './CreateStatusModal';
import { StatusViewer } from './StatusViewer';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, currentUser } = useAuth();
  const [allStories, setAllStories] = useState<UserStatusStory[]>([]);
  const [activeStory, setActiveStory] = useState<UserStatusStory | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const q = query(collection(db, 'status'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: UserStatusStory[] = [];
      const now = Date.now();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Filter out expired statuses (>24 hours)
        const validStatuses = (data.statuses || []).filter(
          (st: any) => st.expiresAt && st.expiresAt > now
        );

        if (validStatuses.length > 0) {
          list.push({
            uid: docSnap.id,
            name: data.name,
            photoURL: data.photoURL,
            statuses: validStatuses,
            updatedAt: data.updatedAt,
          });
        }
      });

      setAllStories(list);
    });

    return () => unsub();
  }, [isOpen, currentUser]);

  if (!isOpen || !userProfile || !currentUser) return null;

  const myStory = allStories.find((s) => s.uid === currentUser.uid);
  const otherStories = allStories.filter((s) => s.uid !== currentUser.uid);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-emerald-600 dark:bg-emerald-700 text-white">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CircleDot className="w-5 h-5" /> Status / Stories
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* My Status Card */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                My Status
              </h3>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div
                  onClick={() => myStory && setActiveStory(myStory)}
                  className={`flex items-center gap-3 cursor-pointer ${
                    myStory ? 'opacity-100' : 'opacity-70'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.name}
                      className={`w-12 h-12 rounded-full object-cover border-2 ${
                        myStory ? 'border-emerald-500' : 'border-slate-300 dark:border-slate-600'
                      }`}
                    />
                    {!myStory && (
                      <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center absolute bottom-0 right-0 border-2 border-white dark:border-slate-800">
                        <Plus className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      My Status
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {myStory
                        ? `${myStory.statuses.length} update(s) • Tap to view`
                        : 'Tap + to add status update'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            {/* Recent Updates from contacts */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Recent Updates ({otherStories.length})
              </h3>

              {otherStories.length > 0 ? (
                <div className="space-y-2">
                  {otherStories.map((story) => (
                    <div
                      key={story.uid}
                      onClick={() => setActiveStory(story)}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                    >
                      <img
                        src={story.photoURL}
                        alt={story.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 p-0.5"
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {story.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {story.statuses.length} status update(s)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic px-1 py-4 text-center">
                  No recent status updates from contacts.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Status Modal */}
      {isCreateOpen && (
        <CreateStatusModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      )}

      {/* Fullscreen Story Viewer */}
      {activeStory && (
        <StatusViewer story={activeStory} onClose={() => setActiveStory(null)} />
      )}
    </>
  );
};
