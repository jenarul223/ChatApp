export type UserStatus = 'online' | 'offline';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  about: string;
  online: boolean;
  lastSeen: number | any; // Timestamp or ms
  createdAt: number | any;
  typingIn?: string | null; // chatId where user is currently typing
  recordingIn?: string | null; // chatId where user is recording audio
  blockedUsers?: string[]; // Array of UIDs blocked by this user
}

export type ChatType = 'direct' | 'group';

export interface ChatLastMessage {
  text: string;
  senderId: string;
  createdAt: number | any;
  messageType: MessageType;
  seen: boolean;
  fileName?: string;
}

export interface ChatItem {
  id: string;
  type: ChatType;
  name?: string; // For groups
  description?: string; // For groups
  groupImage?: string; // For groups
  adminIds?: string[]; // UIDs of group admins
  createdBy?: string; // UID of creator
  participants: string[]; // List of UIDs
  participantDetails?: {
    [uid: string]: {
      name: string;
      photoURL: string;
      email: string;
    };
  };
  lastMessage?: ChatLastMessage | null;
  pinned?: { [uid: string]: boolean };
  archived?: { [uid: string]: boolean };
  muted?: { [uid: string]: boolean };
  unreadCount?: { [uid: string]: number };
  typing?: { [uid: string]: boolean };
  recording?: { [uid: string]: boolean };
  createdAt: number | any;
  updatedAt: number | any;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'pdf' | 'docx' | 'zip' | 'document';

export interface MessageReplyInfo {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  messageType: MessageType;
}

export interface MessageItem {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  senderPhoto?: string;
  receiverId?: string; // For 1-on-1
  groupId?: string; // For group
  messageType: MessageType;
  text: string;
  fileURL?: string;
  fileName?: string;
  fileSize?: number; // In bytes
  fileType?: string; // MIME type
  createdAt: number | any;
  edited?: boolean;
  editedAt?: number | any;
  seenBy: string[]; // Array of user UIDs who have seen this message
  deletedFor: string[]; // Array of user UIDs who deleted for themselves
  isDeletedEveryone?: boolean;
  replyTo?: MessageReplyInfo | null;
  starredBy?: string[]; // UIDs who starred this message
}

export interface StatusViewer {
  uid: string;
  viewedAt: number | any;
  name?: string;
  photoURL?: string;
}

export interface StatusItem {
  id: string;
  type: 'image' | 'video' | 'text';
  content: string; // Image/video URL or text content
  caption?: string;
  bgGradient?: string; // For text status
  createdAt: number | any;
  expiresAt: number | any; // 24 hours after creation
  views: StatusViewer[];
}

export interface UserStatusStory {
  uid: string;
  name: string;
  photoURL: string;
  statuses: StatusItem[];
  updatedAt: number | any;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  readReceipts: boolean;
  lastSeenPrivacy: 'everyone' | 'contacts' | 'nobody';
  profilePhotoPrivacy: 'everyone' | 'contacts' | 'nobody';
  notificationSound: boolean;
  desktopNotifications: boolean;
  }
