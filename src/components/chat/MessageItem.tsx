import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { MessageItem as IMessageItem, MessageReplyInfo } from '../../types';
import { formatTime, formatFileSize } from '../../utils/helpers';
import {
  Check,
  CheckCheck,
  Star,
  CornerUpLeft,
  Copy,
  Edit2,
  Trash2,
  Download,
  FileText,
  Music,
  Play,
  Pause,
  MoreVertical,
  ExternalLink,
  Ban,
} from 'lucide-react';

interface MessageItemProps {
  message: IMessageItem;
  isGroup: boolean;
  onSetReply: (reply: MessageReplyInfo) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isGroup, onSetReply }) => {
  const { currentUser } = useAuth();
  const {
    editMessage,
    deleteForMeMessage,
    deleteForEveryoneMessage,
    toggleStarMessage,
    setEditingMessage,
  } = useChat();

  const [showMenu, setShowMenu] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  if (!currentUser) return null;

  const isMe = message.senderId === currentUser.uid;
  const isStarred = message.starredBy?.includes(currentUser.uid);
  const isDeleted = message.isDeletedEveryone;

  // Read status ticks calculation
  const isSeenByOthers = message.seenBy && message.seenBy.filter((uid) => uid !== message.senderId).length > 0;

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
    }
    setShowMenu(false);
  };

  const handleToggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  return (
    <div
      className={`group relative flex flex-col my-1 ${
        isMe ? 'items-end' : 'items-start'
      }`}
    >
      {/* Message Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl px-3.5 py-2.5 shadow-xs transition-all ${
          isMe
            ? 'bg-emerald-600 text-white rounded-tr-none'
            : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-600/50'
        }`}
      >
        {/* Hover Context Actions Icon */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
            isMe
              ? 'bg-emerald-800/80 text-white hover:bg-emerald-900'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {/* Sender Name in Group Chat */}
        {isGroup && !isMe && message.senderName && (
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
            {message.senderName}
          </div>
        )}

        {/* Reply Context Banner */}
        {message.replyTo && (
          <div
            className={`p-2 rounded-lg mb-1 text-xs border-l-4 ${
              isMe
                ? 'bg-emerald-800/60 border-emerald-300 text-emerald-100'
                : 'bg-slate-100 dark:bg-slate-900 border-emerald-500 text-slate-600 dark:text-slate-300'
            }`}
          >
            <div className="font-semibold text-[11px] text-emerald-400">
              {message.replyTo.senderName}
            </div>
            <div className="truncate text-[11px] opacity-90">{message.replyTo.text}</div>
          </div>
        )}

        {/* Deleted Message Notice */}
        {isDeleted ? (
          <div className="flex items-center gap-1.5 italic text-xs opacity-70 py-0.5">
            <Ban className="w-3.5 h-3.5" />
            <span>This message was deleted</span>
          </div>
        ) : (
          /* Normal Message Content */
          <div className="space-y-1">
            {/* Image Attachment */}
            {message.messageType === 'image' && message.fileURL && (
              <div className="rounded-xl overflow-hidden my-1 max-w-sm">
                <img
                  src={message.fileURL}
                  alt={message.fileName || 'Image'}
                  onClick={() => setIsModalOpen(true)}
                  className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                />
              </div>
            )}

            {/* Video Attachment */}
            {message.messageType === 'video' && message.fileURL && (
              <div className="rounded-xl overflow-hidden my-1 max-w-sm">
                <video src={message.fileURL} controls className="w-full max-h-64 object-cover" />
              </div>
            )}

            {/* Audio Attachment */}
            {message.messageType === 'audio' && message.fileURL && (
              <div className="flex items-center gap-3 p-2 bg-black/10 dark:bg-slate-900/40 rounded-xl my-1 min-w-[200px]">
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className={`p-2 rounded-full text-white shadow-md ${
                    isMe ? 'bg-emerald-800' : 'bg-emerald-600'
                  }`}
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <audio
                  ref={audioRef}
                  src={message.fileURL}
                  onEnded={() => setIsPlayingAudio(false)}
                  className="hidden"
                />
                <div className="flex-1">
                  <div className="text-xs font-semibold">Voice Note</div>
                  <div className="text-[10px] opacity-80">Audio recording</div>
                </div>
              </div>
            )}

            {/* Document Attachments (PDF, DOCX, ZIP, etc) */}
            {(message.messageType === 'pdf' ||
              message.messageType === 'docx' ||
              message.messageType === 'zip' ||
              message.messageType === 'document') &&
              message.fileURL && (
                <div className="flex items-center justify-between gap-3 p-2.5 bg-black/10 dark:bg-slate-900/40 rounded-xl border border-white/10 my-1">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-semibold truncate">
                        {message.fileName || 'Attachment'}
                      </div>
                      <div className="text-[10px] opacity-75">
                        {formatFileSize(message.fileSize)}
                      </div>
                    </div>
                  </div>
                  <a
                    href={message.fileURL}
                    download={message.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-emerald-600 text-white rounded-lg flex-shrink-0 hover:bg-emerald-500 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              )}

            {/* Message Text */}
            {message.text && (
              <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                {message.text}
              </div>
            )}
          </div>
        )}

        {/* Message Footer: Timestamp, Edited Tag, Star Icon, Read Ticks */}
        <div
          className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
            isMe ? 'text-emerald-200' : 'text-slate-400 dark:text-slate-400'
          }`}
        >
          {isStarred && <Star className="w-3 h-3 text-amber-300 fill-amber-300" />}
          {message.edited && <span className="italic text-[9px]">edited</span>}
          <span>{formatTime(message.createdAt)}</span>

          {isMe && !isDeleted && (
            <span className="ml-0.5">
              {isSeenByOthers ? (
                <CheckCheck className="w-3.5 h-3.5 text-sky-300 inline" />
              ) : message.seenBy?.length > 0 ? (
                <CheckCheck className="w-3.5 h-3.5 inline opacity-80" />
              ) : (
                <Check className="w-3.5 h-3.5 inline opacity-80" />
              )}
            </span>
          )}
        </div>

        {/* Dropdown Menu for Message Actions */}
        {showMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-8 z-30 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-xs text-slate-700 dark:text-slate-200"
          >
            <button
              onClick={() => {
                onSetReply({
                  id: message.id,
                  senderId: message.senderId,
                  senderName: message.senderName || 'User',
                  text: message.text || `[${message.messageType.toUpperCase()}]`,
                  messageType: message.messageType,
                });
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <CornerUpLeft className="w-3.5 h-3.5 text-emerald-500" />
              <span>Reply</span>
            </button>

            <button
              onClick={() => {
                toggleStarMessage(message.id);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>{isStarred ? 'Unstar' : 'Star Message'}</span>
            </button>

            {message.text && (
              <button
                onClick={handleCopy}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-sky-500" />
                <span>Copy Text</span>
              </button>
            )}

            {isMe && message.messageType === 'text' && !isDeleted && (
              <button
                onClick={() => {
                  setEditingMessage(message);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5 text-purple-500" />
                <span>Edit Message</span>
              </button>
            )}

            <div className="my-1 border-t border-slate-200 dark:border-slate-700" />

            <button
              onClick={() => {
                deleteForMeMessage(message.id);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete For Me</span>
            </button>

            {isMe && !isDeleted && (
              <button
                onClick={() => {
                  deleteForEveryoneMessage(message.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-500 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete For Everyone</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Modal Image Preview */}
      {isModalOpen && message.fileURL && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
        >
          <img
            src={message.fileURL}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
