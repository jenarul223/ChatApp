import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  getDocs,
  getDoc,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from './AuthContext';
import { ChatItem, MessageItem, MessageType, MessageReplyInfo, UserProfile } from '../types';
import { getMessageTypeFromFile } from '../utils/helpers';
import { useNotification } from '../hooks/useNotification';

interface ChatContextType {
  chats: ChatItem[];
  activeChatId: string | null;
  activeChat: ChatItem | null;
  messages: MessageItem[];
  loadingChats: boolean;
  loadingMessages: boolean;
  replyToMessage: MessageReplyInfo | null;
  setReplyToMessage: (reply: MessageReplyInfo | null) => void;
  editingMessage: MessageItem | null;
  setEditingMessage: (msg: MessageItem | null) => void;
  selectChat: (chatId: string | null) => void;
  startDirectChat: (targetUser: UserProfile) => Promise<string>;
  createGroupChat: (name: string, description: string, memberUids: string[], groupImageFile?: File | null) => Promise<string>;
  sendMessage: (text: string, files?: File[], replyMessage?: MessageReplyInfo | null) => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  deleteForMeMessage: (messageId: string) => Promise<void>;
  deleteForEveryoneMessage: (messageId: string) => Promise<void>;
  toggleStarMessage: (messageId: string) => Promise<void>;
  togglePinChat: (chatId: string) => Promise<void>;
  toggleArchiveChat: (chatId: string) => Promise<void>;
  toggleMuteChat: (chatId: string) => Promise<void>;
  clearChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  setTypingStatus: (isTyping: boolean) => void;
  setRecordingStatus: (isRecording: boolean) => void;
  // Group Ops
  updateGroupInfo: (chatId: string, name: string, description: string, imageFile?: File | null) => Promise<void>;
  addGroupMembers: (chatId: string, memberUids: string[]) => Promise<void>;
  removeGroupMember: (chatId: string, memberUid: string) => Promise<void>;
  makeGroupAdmin: (chatId: string, memberUid: string) => Promise<void>;
  leaveGroup: (chatId: string) => Promise<void>;
  // Global search & User Search
  allUsers: UserProfile[];
  searchUsers: (searchTerm: string) => UserProfile[];
  searchUsersByEmail: (emailInput: string) => Promise<UserProfile[]>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, currentUser } = useAuth();
  const { showNotification } = useNotification();

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<MessageReplyInfo | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageItem | null>(null);

  const typingTimeoutRef = useRef<any>(null);

  // Load all registered users for search
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const users: UserProfile[] = [];
        snapshot.forEach((doc) => {
          if (doc.id !== currentUser.uid) {
            users.push(doc.data() as UserProfile);
          }
        });
        setAllUsers(users);
      },
      (err) => {
        console.warn('Users query listener error:', err);
      }
    );
    return () => unsub();
  }, [currentUser]);

  // Real-time listener for current user's chats
  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      setLoadingChats(false);
      return;
    }

    setLoadingChats(true);
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: ChatItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ChatItem);
        });

        // Sort chats by updatedAt timestamp descending
        list.sort((a, b) => {
          const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt || 0);
          const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt || 0);
          return timeB - timeA;
        });

        setChats(list);
        setLoadingChats(false);
      },
      (err) => {
        console.warn('Chats query listener error:', err);
        setLoadingChats(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // Real-time listener for active chat messages
  useEffect(() => {
    if (!activeChatId || !currentUser) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    const messagesRef = collection(db, 'chats', activeChatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const msgList: MessageItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Filter out messages deleted for me
          if (!data.deletedFor?.includes(currentUser.uid)) {
            msgList.push({ id: docSnap.id, ...data } as MessageItem);
          }

          // Mark unread messages as seen
          if (data.senderId !== currentUser.uid && !data.seenBy?.includes(currentUser.uid)) {
            updateDoc(docSnap.ref, {
              seenBy: arrayUnion(currentUser.uid),
            }).catch(() => {});
          }
        });

        setMessages(msgList);
        setLoadingMessages(false);

        // Reset unread count for current user in chat doc
        const chatDocRef = doc(db, 'chats', activeChatId);
        updateDoc(chatDocRef, {
          [`unreadCount.${currentUser.uid}`]: 0,
        }).catch(() => {});
      },
      (err) => {
        console.warn('Messages query listener error:', err);
        setLoadingMessages(false);
      }
    );

    return () => unsub();
  }, [activeChatId, currentUser]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const selectChat = (chatId: string | null) => {
    if (activeChatId && activeChatId !== chatId) {
      setTypingStatus(false);
    }
    setActiveChatId(chatId);
    setReplyToMessage(null);
    setEditingMessage(null);
  };

  // Start or open existing 1-on-1 direct chat
  const startDirectChat = async (targetUser: UserProfile): Promise<string> => {
    if (!currentUser || !userProfile) throw new Error('Not logged in');

    const sortedUids = [currentUser.uid, targetUser.uid].sort();
    const chatId = `direct_${sortedUids.join('_')}`;

    const chatDocRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatDocRef);

    if (!chatSnap.exists()) {
      const newChat: ChatItem = {
        id: chatId,
        type: 'direct',
        participants: sortedUids,
        participantDetails: {
          [currentUser.uid]: {
            name: userProfile.name,
            photoURL: userProfile.photoURL,
            email: userProfile.email,
          },
          [targetUser.uid]: {
            name: targetUser.name,
            photoURL: targetUser.photoURL,
            email: targetUser.email,
          },
        },
        unreadCount: {
          [currentUser.uid]: 0,
          [targetUser.uid]: 0,
        },
        pinned: {},
        archived: {},
        muted: {},
        typing: {},
        recording: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(chatDocRef, newChat);
    }

    selectChat(chatId);
    return chatId;
  };

  // Create group chat
  const createGroupChat = async (
    name: string,
    description: string,
    memberUids: string[],
    groupImageFile?: File | null
  ): Promise<string> => {
    if (!currentUser || !userProfile) throw new Error('Not logged in');

    const participants = Array.from(new Set([currentUser.uid, ...memberUids]));
    let groupImage = '';

    const chatId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (groupImageFile) {
      try {
        const fileRef = ref(storage, `groups/${chatId}/${Date.now()}_${groupImageFile.name}`);
        await uploadBytes(fileRef, groupImageFile);
        groupImage = await getDownloadURL(fileRef);
      } catch (err) {
        console.warn('Group image upload error:', err);
      }
    }

    const participantDetails: any = {
      [currentUser.uid]: {
        name: userProfile.name,
        photoURL: userProfile.photoURL,
        email: userProfile.email,
      },
    };

    // Populate member details from cached allUsers
    for (const uid of memberUids) {
      const found = allUsers.find((u) => u.uid === uid);
      if (found) {
        participantDetails[uid] = {
          name: found.name,
          photoURL: found.photoURL,
          email: found.email,
        };
      }
    }

    const unreadMap: any = {};
    participants.forEach((p) => (unreadMap[p] = 0));

    const newGroup: ChatItem = {
      id: chatId,
      type: 'group',
      name,
      description,
      groupImage: groupImage || '',
      adminIds: [currentUser.uid],
      createdBy: currentUser.uid,
      participants,
      participantDetails,
      unreadCount: unreadMap,
      pinned: {},
      archived: {},
      muted: {},
      typing: {},
      recording: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'chats', chatId), newGroup);

    // Add system message "Created group"
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      chatId,
      senderId: 'system',
      senderName: 'System',
      messageType: 'text',
      text: `${userProfile.name} created group "${name}"`,
      createdAt: serverTimestamp(),
      seenBy: participants,
      deletedFor: [],
    });

    selectChat(chatId);
    return chatId;
  };

  // Send message with text and/or files
  const sendMessage = async (
    text: string,
    files?: File[],
    replyMsg?: MessageReplyInfo | null
  ): Promise<void> => {
    if (!activeChatId || !currentUser || !userProfile) return;

    const messagesRef = collection(db, 'chats', activeChatId, 'messages');
    const chatRef = doc(db, 'chats', activeChatId);

    // If files attached, upload and send each file message
    if (files && files.length > 0) {
      for (const file of files) {
        let fileURL = '';
        try {
          const fileRef = ref(storage, `chats/${activeChatId}/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          fileURL = await getDownloadURL(fileRef);
        } catch (err) {
          console.warn('File upload failed (falling back to local ObjectURL for demo preview):', err);
          fileURL = URL.createObjectURL(file);
        }

        const msgType = getMessageTypeFromFile(file);
        const newMsg: Partial<MessageItem> = {
          chatId: activeChatId,
          senderId: currentUser.uid,
          senderName: userProfile.name,
          senderPhoto: userProfile.photoURL,
          messageType: msgType,
          text: text && files.length === 1 ? text : '', // Attach caption if single file
          fileURL,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          createdAt: serverTimestamp(),
          seenBy: [currentUser.uid],
          deletedFor: [],
          replyTo: replyMsg || null,
          starredBy: [],
        };

        await addDoc(messagesRef, newMsg);

        // Update chat last message
        const updateData: any = {
          lastMessage: {
            text: `[${msgType.toUpperCase()}] ${file.name}`,
            senderId: currentUser.uid,
            createdAt: serverTimestamp(),
            messageType: msgType,
            fileName: file.name,
            seen: false,
          },
          updatedAt: serverTimestamp(),
        };

        // Increment unread for non-senders
        if (activeChat?.participants) {
          activeChat.participants.forEach((pId) => {
            if (pId !== currentUser.uid) {
              updateData[`unreadCount.${pId}`] = (activeChat.unreadCount?.[pId] || 0) + 1;
            }
          });
        }

        await updateDoc(chatRef, updateData);
      }
    } else if (text.trim()) {
      // Pure text message
      const newMsg: Partial<MessageItem> = {
        chatId: activeChatId,
        senderId: currentUser.uid,
        senderName: userProfile.name,
        senderPhoto: userProfile.photoURL,
        messageType: 'text',
        text: text.trim(),
        createdAt: serverTimestamp(),
        seenBy: [currentUser.uid],
        deletedFor: [],
        replyTo: replyMsg || null,
        starredBy: [],
      };

      await addDoc(messagesRef, newMsg);

      const updateData: any = {
        lastMessage: {
          text: text.trim(),
          senderId: currentUser.uid,
          createdAt: serverTimestamp(),
          messageType: 'text',
          seen: false,
        },
        updatedAt: serverTimestamp(),
      };

      if (activeChat?.participants) {
        activeChat.participants.forEach((pId) => {
          if (pId !== currentUser.uid) {
            updateData[`unreadCount.${pId}`] = (activeChat.unreadCount?.[pId] || 0) + 1;
          }
        });
      }

      await updateDoc(chatRef, updateData);
    }

    setReplyToMessage(null);
    setTypingStatus(false);
    setRecordingStatus(false);
  };

  const editMessage = async (messageId: string, newText: string) => {
    if (!activeChatId) return;
    const msgRef = doc(db, 'chats', activeChatId, 'messages', messageId);
    await updateDoc(msgRef, {
      text: newText,
      edited: true,
      editedAt: serverTimestamp(),
    });
    setEditingMessage(null);
  };

  const deleteForMeMessage = async (messageId: string) => {
    if (!activeChatId || !currentUser) return;
    const msgRef = doc(db, 'chats', activeChatId, 'messages', messageId);
    await updateDoc(msgRef, {
      deletedFor: arrayUnion(currentUser.uid),
    });
  };

  const deleteForEveryoneMessage = async (messageId: string) => {
    if (!activeChatId) return;
    const msgRef = doc(db, 'chats', activeChatId, 'messages', messageId);
    await updateDoc(msgRef, {
      text: 'This message was deleted',
      isDeletedEveryone: true,
      fileURL: '',
      fileName: '',
    });
  };

  const toggleStarMessage = async (messageId: string) => {
    if (!activeChatId || !currentUser) return;
    const msgRef = doc(db, 'chats', activeChatId, 'messages', messageId);
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;

    const isStarred = msg.starredBy?.includes(currentUser.uid);
    await updateDoc(msgRef, {
      starredBy: isStarred ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
  };

  const togglePinChat = async (chatId: string) => {
    if (!currentUser) return;
    const chatRef = doc(db, 'chats', chatId);
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    const isPinned = !!chat.pinned?.[currentUser.uid];
    await updateDoc(chatRef, {
      [`pinned.${currentUser.uid}`]: !isPinned,
    });
  };

  const toggleArchiveChat = async (chatId: string) => {
    if (!currentUser) return;
    const chatRef = doc(db, 'chats', chatId);
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    const isArchived = !!chat.archived?.[currentUser.uid];
    await updateDoc(chatRef, {
      [`archived.${currentUser.uid}`]: !isArchived,
    });
  };

  const toggleMuteChat = async (chatId: string) => {
    if (!currentUser) return;
    const chatRef = doc(db, 'chats', chatId);
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    const isMuted = !!chat.muted?.[currentUser.uid];
    await updateDoc(chatRef, {
      [`muted.${currentUser.uid}`]: !isMuted,
    });
  };

  const clearChat = async (chatId: string) => {
    if (!currentUser) return;
    const msgsRef = collection(db, 'chats', chatId, 'messages');
    const snapshot = await getDocs(msgsRef);
    const promises = snapshot.docs.map((d) =>
      updateDoc(d.ref, { deletedFor: arrayUnion(currentUser.uid) })
    );
    await Promise.all(promises);
  };

  const deleteChat = async (chatId: string) => {
    if (!currentUser) return;
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      participants: arrayRemove(currentUser.uid),
    });
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  };

  const setTypingStatus = (isTyping: boolean) => {
    if (!activeChatId || !currentUser) return;
    const chatRef = doc(db, 'chats', activeChatId);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setDoc(
      chatRef,
      {
        typing: {
          [currentUser.uid]: isTyping,
        },
      },
      { merge: true }
    ).catch(() => {});

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setDoc(
          chatRef,
          {
            typing: {
              [currentUser.uid]: false,
            },
          },
          { merge: true }
        ).catch(() => {});
      }, 3000);
    }
  };

  const setRecordingStatus = (isRecording: boolean) => {
    if (!activeChatId || !currentUser) return;
    const chatRef = doc(db, 'chats', activeChatId);
    setDoc(
      chatRef,
      {
        recording: {
          [currentUser.uid]: isRecording,
        },
      },
      { merge: true }
    ).catch(() => {});
  };

  // Group Management Functions
  const updateGroupInfo = async (
    chatId: string,
    name: string,
    description: string,
    imageFile?: File | null
  ) => {
    const chatRef = doc(db, 'chats', chatId);
    let groupImage = activeChat?.groupImage || '';

    if (imageFile) {
      try {
        const fileRef = ref(storage, `groups/${chatId}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(fileRef, imageFile);
        groupImage = await getDownloadURL(fileRef);
      } catch (e) {
        console.warn('Group image upload failed:', e);
      }
    }

    await updateDoc(chatRef, {
      name,
      description,
      groupImage,
      updatedAt: serverTimestamp(),
    });
  };

  const addGroupMembers = async (chatId: string, memberUids: string[]) => {
    const chatRef = doc(db, 'chats', chatId);
    const newDetails: any = {};
    for (const uid of memberUids) {
      const u = allUsers.find((user) => user.uid === uid);
      if (u) {
        newDetails[`participantDetails.${uid}`] = {
          name: u.name,
          photoURL: u.photoURL,
          email: u.email,
        };
      }
    }

    await updateDoc(chatRef, {
      participants: arrayUnion(...memberUids),
      ...newDetails,
      updatedAt: serverTimestamp(),
    });
  };

  const removeGroupMember = async (chatId: string, memberUid: string) => {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      participants: arrayRemove(memberUid),
      adminIds: arrayRemove(memberUid),
      updatedAt: serverTimestamp(),
    });
  };

  const makeGroupAdmin = async (chatId: string, memberUid: string) => {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      adminIds: arrayUnion(memberUid),
    });
  };

  const leaveGroup = async (chatId: string) => {
    if (!currentUser) return;
    await removeGroupMember(chatId, currentUser.uid);
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  };

  const searchUsers = (searchTerm: string) => {
    if (!searchTerm.trim()) return allUsers;
    const term = searchTerm.toLowerCase();
    return allUsers.filter(
      (u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    );
  };

  const searchUsersByEmail = async (emailInput: string): Promise<UserProfile[]> => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return [];

    // Filter local allUsers list for exact email match
    const cached = allUsers.filter((u) => u.email.toLowerCase() === trimmed);
    if (cached.length > 0) return cached;

    // Direct exact query in Firestore users collection
    try {
      const q = query(
        collection(db, 'users'),
        where('email', '==', trimmed),
        limit(5)
      );
      const snap = await getDocs(q);
      const results: UserProfile[] = [];
      snap.forEach((docSnap) => {
        if (docSnap.id !== currentUser?.uid) {
          results.push(docSnap.data() as UserProfile);
        }
      });
      return results;
    } catch (err) {
      console.warn('Error querying users by email:', err);
      return [];
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId,
        activeChat,
        messages,
        loadingChats,
        loadingMessages,
        replyToMessage,
        setReplyToMessage,
        editingMessage,
        setEditingMessage,
        selectChat,
        startDirectChat,
        createGroupChat,
        sendMessage,
        editMessage,
        deleteForMeMessage,
        deleteForEveryoneMessage,
        toggleStarMessage,
        togglePinChat,
        toggleArchiveChat,
        toggleMuteChat,
        clearChat,
        deleteChat,
        setTypingStatus,
        setRecordingStatus,
        updateGroupInfo,
        addGroupMembers,
        removeGroupMember,
        makeGroupAdmin,
        leaveGroup,
        allUsers,
        searchUsers,
        searchUsersByEmail,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
