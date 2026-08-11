import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { UserStatusStory, StatusItem } from '../../types';
import { formatTime } from '../../utils/helpers';
import { X, ChevronLeft, ChevronRight, Eye, Play, Pause } from 'lucide-react';

interface StatusViewerProps {
  story: UserStatusStory | null;
  onClose: () => void;
}

export const StatusViewer: React.FC<StatusViewerProps> = ({ story, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  const timerRef = useRef<any>(null);

  if (!story || !story.statuses || story.statuses.length === 0) return null;

  const currentStatus: StatusItem = story.statuses[currentIndex];
  const isOwner = currentUser?.uid === story.uid;

  // Record view if not already recorded
  useEffect(() => {
    if (!currentUser || isOwner || !currentStatus) return;

    const hasViewed = currentStatus.views?.some((v) => v.uid === currentUser.uid);
    if (!hasViewed) {
      const statusDocRef = doc(db, 'status', story.uid);

      // Clone existing statuses and append view
      const updatedStatuses = story.statuses.map((st) => {
        if (st.id === currentStatus.id) {
          return {
            ...st,
            views: [
              ...(st.views || []),
              {
                uid: currentUser.uid,
                viewedAt: Date.now(),
                name: userProfile?.name || 'User',
                photoURL: userProfile?.photoURL || '',
              },
            ],
          };
        }
        return st;
      });

      updateDoc(statusDocRef, { statuses: updatedStatuses }).catch(() => {});
    }
  }, [currentIndex, story, currentUser, isOwner, userProfile]);

  // Auto-progress bar timer
  useEffect(() => {
    setProgress(0);
    if (isPaused) return;

    const duration = 5000; // 5 seconds per slide
    const interval = 50;
    const step = (interval / duration) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          if (currentIndex < story.statuses.length - 1) {
            setCurrentIndex((idx) => idx + 1);
          } else {
            onClose();
          }
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused, story.statuses.length]);

  const handleNext = () => {
    if (currentIndex < story.statuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white select-none">
      {/* Container */}
      <div
        className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-2xl overflow-hidden bg-slate-950 flex flex-col justify-between"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Top Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 space-y-3 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex gap-1.5 w-full">
            {story.statuses.map((st, idx) => (
              <div
                key={st.id || idx}
                className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width:
                      idx < currentIndex
                        ? '100%'
                        : idx === currentIndex
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* User Info Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={story.photoURL}
                alt={story.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
              />
              <div>
                <div className="text-sm font-bold text-white leading-tight">{story.name}</div>
                <div className="text-xs text-slate-300">
                  {formatTime(currentStatus?.createdAt)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Media / Text Display Stage */}
        <div className="flex-1 relative flex items-center justify-center bg-black">
          {currentStatus?.type === 'text' ? (
            <div
              className={`w-full h-full flex items-center justify-center p-8 text-center text-white text-3xl font-bold ${
                currentStatus.bgGradient || 'bg-gradient-to-tr from-purple-600 to-indigo-600'
              }`}
            >
              {currentStatus.content}
            </div>
          ) : currentStatus?.type === 'video' ? (
            <video
              src={currentStatus.content}
              autoPlay
              playsInline
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <img
              src={currentStatus?.content}
              alt="Status"
              className="max-h-full max-w-full object-contain"
            />
          )}

          {/* Optional Caption */}
          {currentStatus?.caption && (
            <div className="absolute bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-center text-sm font-medium text-white">
              {currentStatus.caption}
            </div>
          )}

          {/* Navigation Tap Overlay */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-20 bottom-20 w-1/3 opacity-0 hover:opacity-100 flex items-center justify-start pl-4"
          >
            <ChevronLeft className="w-10 h-10 text-white/70" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-20 bottom-20 w-1/3 opacity-0 hover:opacity-100 flex items-center justify-end pr-4"
          >
            <ChevronRight className="w-10 h-10 text-white/70" />
          </button>
        </div>

        {/* Bottom View Counter (Author view) */}
        {isOwner && (
          <div className="absolute bottom-0 left-0 right-0 z-20 p-3 bg-black/60 backdrop-blur-md flex flex-col items-center">
            <button
              onClick={() => setShowViewers(!showViewers)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>{currentStatus.views?.length || 0} views</span>
            </button>
          </div>
        )}

        {/* Viewers Drawer */}
        {showViewers && (
          <div className="absolute bottom-0 left-0 right-0 z-30 max-h-60 bg-slate-900 border-t border-slate-700 rounded-t-2xl p-4 overflow-y-auto space-y-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Viewed by ({currentStatus.views?.length || 0})
              </span>
              <button onClick={() => setShowViewers(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            {currentStatus.views && currentStatus.views.length > 0 ? (
              currentStatus.views.map((v, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={v.photoURL || 'https://via.placeholder.com/40'}
                      alt={v.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="font-medium text-slate-200">{v.name || 'User'}</span>
                  </div>
                  <span className="text-slate-400">{formatTime(v.viewedAt)}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic">No views yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
