import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { useTheme } from '../../context/ThemeContext';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  X,
  Image as ImageIcon,
  FileText,
  Music,
  Trash2,
  Check,
} from 'lucide-react';

export const MessageInput: React.FC = () => {
  const {
    sendMessage,
    replyToMessage,
    setReplyToMessage,
    editingMessage,
    setEditingMessage,
    editMessage,
    setTypingStatus,
    setRecordingStatus,
  } = useChat();

  const { theme } = useTheme();

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRecorder = useAudioRecorder();

  // Populate text when editing a message
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
    }
  }, [editingMessage]);

  // Sync typing status
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    setTypingStatus(val.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
      setShowAttachMenu(false);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartRecording = async () => {
    try {
      await audioRecorder.startRecording();
      setRecordingStatus(true);
    } catch (err) {
      console.warn('Microphone permission denied:', err);
    }
  };

  const handleSendVoiceNote = async () => {
    const blob = await audioRecorder.stopRecording();
    setRecordingStatus(false);
    if (blob) {
      const audioFile = new File([blob], `voice_note_${Date.now()}.webm`, {
        type: 'audio/webm',
      });
      await sendMessage('', [audioFile]);
    }
  };

  const handleCancelVoiceNote = () => {
    audioRecorder.cancelRecording();
    setRecordingStatus(false);
  };

  const handleSend = async () => {
    if (editingMessage) {
      if (text.trim()) {
        await editMessage(editingMessage.id, text.trim());
        setText('');
      }
      return;
    }

    if (!text.trim() && selectedFiles.length === 0) return;

    await sendMessage(text, selectedFiles, replyToMessage);
    setText('');
    setSelectedFiles([]);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
  };

  return (
    <div className="relative bg-slate-100 dark:bg-[#1e293b]/90 border-t border-slate-200 dark:border-slate-700/50 p-3 sm:px-6 transition-colors">
      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-3 z-40 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
            width={320}
            height={400}
          />
        </div>
      )}

      {/* Attachment Menu Popup */}
      {showAttachMenu && (
        <div className="absolute bottom-16 left-12 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 space-y-1 text-xs text-slate-700 dark:text-slate-200">
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
            <ImageIcon className="w-4 h-4 text-purple-500" />
            <span>Photos & Videos</span>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
            <FileText className="w-4 h-4 text-sky-500" />
            <span>Documents (PDF, DOCX, ZIP)</span>
            <input
              type="file"
              accept=".pdf,.docx,.doc,.zip,.txt"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
            <Music className="w-4 h-4 text-emerald-500" />
            <span>Audio Files</span>
            <input
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Reply Banner Preview */}
      {replyToMessage && (
        <div className="flex items-center justify-between p-2.5 bg-slate-200/80 dark:bg-slate-800 rounded-xl mb-2 text-xs border-l-4 border-emerald-500">
          <div>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Replying to {replyToMessage.senderName}
            </span>
            <p className="text-slate-600 dark:text-slate-300 truncate max-w-md">
              {replyToMessage.text}
            </p>
          </div>
          <button
            onClick={() => setReplyToMessage(null)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editing Banner Preview */}
      {editingMessage && (
        <div className="flex items-center justify-between p-2.5 bg-amber-500/10 border-l-4 border-amber-500 rounded-xl mb-2 text-xs">
          <span className="font-semibold text-amber-500">Editing Message</span>
          <button
            onClick={() => {
              setEditingMessage(null);
              setText('');
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected Files Preview Chips */}
      {selectedFiles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {selectedFiles.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold"
            >
              <span className="truncate max-w-[120px]">{f.name}</span>
              <button onClick={() => removeSelectedFile(i)}>
                <X className="w-3.5 h-3.5 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recording Controls or Standard Input */}
      {audioRecorder.isRecording ? (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-2 text-xs text-red-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <span className="font-bold">Recording... {audioRecorder.recordingTime}s</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelVoiceNote}
              className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-500 rounded-full"
              title="Cancel"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSendVoiceNote}
              className="p-2 bg-emerald-600 text-white hover:bg-emerald-500 rounded-full shadow"
              title="Send Voice Note"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {/* Emoji toggle */}
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachMenu(false);
            }}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"
            title="Emoji Picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Attach toggle */}
          <button
            onClick={() => {
              setShowAttachMenu(!showAttachMenu);
              setShowEmojiPicker(false);
            }}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"
            title="Attach Media or File"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none max-h-24 transition-colors"
          />

          {/* Voice Record or Send Button */}
          {text.trim() || selectedFiles.length > 0 || editingMessage ? (
            <button
              onClick={handleSend}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-md transition-colors flex-shrink-0"
              title="Send Message"
            >
              {editingMessage ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            </button>
          ) : (
            <button
              onClick={handleStartRecording}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-md transition-colors flex-shrink-0"
              title="Record Voice Note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
