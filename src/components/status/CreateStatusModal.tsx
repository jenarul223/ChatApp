import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../firebase';
import { collection, doc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { X, Type, Image as ImageIcon, Send, Palette } from 'lucide-react';

interface CreateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GRADIENTS = [
  'bg-gradient-to-tr from-purple-600 to-indigo-600',
  'bg-gradient-to-tr from-emerald-600 to-teal-500',
  'bg-gradient-to-tr from-pink-600 to-rose-500',
  'bg-gradient-to-tr from-amber-500 to-orange-600',
  'bg-gradient-to-tr from-blue-600 to-cyan-500',
  'bg-gradient-to-tr from-slate-800 to-slate-900',
];

export const CreateStatusModal: React.FC<CreateStatusModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, currentUser } = useAuth();

  const [type, setType] = useState<'text' | 'media'>('text');
  const [text, setText] = useState('');
  const [gradientIdx, setGradientIdx] = useState(0);

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !userProfile || !currentUser) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setFilePreview(URL.createObjectURL(selected));
    }
  };

  const handlePublish = async () => {
    if (type === 'text' && !text.trim()) return;
    if (type === 'media' && !file) return;

    setLoading(true);
    try {
      const statusId = `status_${Date.now()}`;
      let content = text.trim();

      if (type === 'media' && file) {
        try {
          const fileRef = ref(storage, `status/${currentUser.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          content = await getDownloadURL(fileRef);
        } catch (err) {
          console.warn('Status file upload fallback:', err);
          content = URL.createObjectURL(file);
        }
      }

      const isVideo = file?.type.startsWith('video/');
      const mediaType = type === 'text' ? 'text' : isVideo ? 'video' : 'image';

      const newStatusItem = {
        id: statusId,
        type: mediaType,
        content,
        caption: type === 'media' ? caption.trim() : '',
        bgGradient: type === 'text' ? GRADIENTS[gradientIdx] : '',
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        views: [],
      };

      const statusDocRef = doc(db, 'status', currentUser.uid);
      await setDoc(
        statusDocRef,
        {
          uid: currentUser.uid,
          name: userProfile.name,
          photoURL: userProfile.photoURL,
          statuses: arrayUnion(newStatusItem),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      onClose();
    } catch (err) {
      console.error('Error creating status:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white">
          <div className="flex gap-2">
            <button
              onClick={() => setType('text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                type === 'text' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Type className="w-4 h-4" /> Text Status
            </button>
            <button
              onClick={() => setType('media')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                type === 'media' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Image / Video
            </button>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Preview Stage */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {type === 'text' ? (
            <div
              className={`w-full h-full flex items-center justify-center p-8 text-center text-white text-2xl font-bold ${GRADIENTS[gradientIdx]}`}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a status..."
                className="bg-transparent w-full text-center text-white placeholder-white/60 focus:outline-none resize-none font-sans"
                rows={4}
                maxLength={200}
                autoFocus
              />
              <button
                onClick={() => setGradientIdx((prev) => (prev + 1) % GRADIENTS.length)}
                className="absolute bottom-4 left-4 p-2.5 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-colors"
                title="Change Background Gradient"
              >
                <Palette className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center relative">
              {filePreview ? (
                file?.type.startsWith('video/') ? (
                  <video src={filePreview} controls className="max-h-[80%] max-w-full object-contain" />
                ) : (
                  <img src={filePreview} alt="Status Preview" className="max-h-[80%] max-w-full object-contain" />
                )
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer p-8 border-2 border-dashed border-slate-700 rounded-2xl hover:border-emerald-500 transition-colors">
                  <ImageIcon className="w-12 h-12 text-slate-500 mb-2" />
                  <span className="text-sm font-semibold text-slate-300">Choose Photo or Video</span>
                  <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}

              {filePreview && (
                <div className="absolute bottom-4 left-4 right-4">
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={handlePublish}
            disabled={loading || (type === 'text' && !text.trim()) || (type === 'media' && !file)}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Post Status <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
    
