import { MessageType } from '../types';

export function getDefaultAvatar(name: string, seed?: string): string {
  const formattedName = encodeURIComponent(name || 'User');
  const bgColors = ['0D9488', '0284C7', '4F46E5', '7C3AED', 'DB2777', 'EA580C', '16A34A'];
  const hash = (seed || name || 'default')
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = bgColors[hash % bgColors.length];
  return `https://ui-avatars.com/api/?name=${formattedName}&background=${color}&color=fff&bold=true&rounded=true&size=128`;
}

export function formatTime(timestamp: any): string {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateSeparator(timestamp: any): string {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

export function formatLastSeen(timestamp: any, online: boolean): string {
  if (online) return 'online';
  if (!timestamp) return 'offline';

  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return 'offline';

  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffMinutes < 1) return 'last seen just now';
  if (diffMinutes < 60) return `last seen ${diffMinutes}m ago`;
  
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) {
    return `last seen today at ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `last seen yesterday at ${timeStr}`;
  }

  return `last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getMessageTypeFromFile(file: File): MessageType {
  const mime = file.type;
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword'
  )
    return 'docx';
  if (mime === 'application/zip' || mime === 'application/x-zip-compressed') return 'zip';
  return 'document';
}
  
