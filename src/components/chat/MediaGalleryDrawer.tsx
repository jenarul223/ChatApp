import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Image as ImageIcon,
  FileText,
  Music,
  Link as LinkIcon,
  Star,
  Download,
  ExternalLink,
} from 'lucide-react';
import { formatFileSize, formatTime } from '../../utils/helpers';

interface MediaGalleryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MediaGalleryDrawer: React.FC<MediaGalleryDrawerProps> = ({ isOpen, onClose }) => {
  const { messages, activeChat } = useChat();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'media' | 'docs' | 'audio' | 'links' | 'starred'>('media');

  if (!isOpen || !activeChat) return null;

  // Filter messages by type
  const mediaMsgs = messages.filter((m) => m.messageType === 'image' || m.messageType === 'video');
  const docMsgs = messages.filter(
    (m) => m.messageType === 'pdf' || m.messageType === 'docx' || m.messageType === 'zip' || m.messageType === 'document'
  );
  const audioMsgs = messages.filter((m) => m.messageType === 'audio');
  
  // Extract URLs from text messages
  const linkMsgs = messages.filter((m) => {
    if (!m.text) return false;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(m.text);
  });

  const starredMsgs = messages.filter((m) => currentUser && m.starredBy?.includes(currentUser.uid));

  return (
    <div className="w-80 h-full border-l border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 flex flex-col z-20 shadow-xl transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Media, Docs & Links
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-xs">
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 py-2.5 font-semibold text-center border-b-2 transition-colors ${
            activeTab === 'media'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Media ({mediaMsgs.length})
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`flex-1 py-2.5 font-semibold text-center border-b-2 transition-colors ${
            activeTab === 'docs'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Docs ({docMsgs.length})
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex-1 py-2.5 font-semibold text-center border-b-2 transition-colors ${
            activeTab === 'audio'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Audio
        </button>
        <button
          onClick={() => setActiveTab('starred')}
          className={`flex-1 py-2.5 font-semibold text-center border-b-2 transition-colors ${
            activeTab === 'starred'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Starred
        </button>
      </div>

      {/* Content Container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {activeTab === 'media' && (
          mediaMsgs.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {mediaMsgs.map((m) => (
                <div
                  key={m.id}
                  className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 group border border-slate-200 dark:border-slate-700"
                >
                  {m.messageType === 'image' ? (
                    <img
                      src={m.fileURL}
                      alt={m.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <video src={m.fileURL} className="w-full h-full object-cover" />
                  )}
                  <a
                    href={m.fileURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-400">No media shared yet.</div>
          )
        )}

        {activeTab === 'docs' && (
          docMsgs.length > 0 ? (
            <div className="space-y-2">
              {docMsgs.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <FileText className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {m.fileName || 'Document'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatFileSize(m.fileSize)} • {formatTime(m.createdAt)}
                      </div>
                    </div>
                  </div>
                  <a
                    href={m.fileURL}
                    download={m.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex-shrink-0"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-400">No documents shared yet.</div>
          )
        )}

        {activeTab === 'audio' && (
          audioMsgs.length > 0 ? (
            <div className="space-y-2">
              {audioMsgs.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <Music className="w-4 h-4 text-purple-400" />
                    <span>Voice Note ({formatTime(m.createdAt)})</span>
                  </div>
                  <audio src={m.fileURL} controls className="w-full h-8" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-400">No audio shared yet.</div>
          )
        )}

        {activeTab === 'starred' && (
          starredMsgs.length > 0 ? (
            <div className="space-y-2">
              {starredMsgs.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{m.senderName || 'User'}</span>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                    {m.text || `[${m.messageType.toUpperCase()}]`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-400">No starred messages.</div>
          )
        )}
      </div>
    </div>
  );
};
