import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { UserProfile } from '../types';
import { getDefaultAvatar } from '../utils/helpers';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, pass: string, name: string, photoFile?: File | null) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: (name?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>, photoFile?: File | null) => Promise<void>;
  demoLogin: (demoEmail: string, demoName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Monitor Auth State & Presence
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Set presence online
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            // Create default profile if missing
            const defaultProf: UserProfile = {
              uid: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email || `${user.uid.slice(0, 8)}@guest.local`,
              photoURL: user.photoURL || getDefaultAvatar(user.displayName || 'User', user.uid),
              about: 'Hey there! I am using WhatsApp Web.',
              online: true,
              lastSeen: serverTimestamp(),
              createdAt: serverTimestamp(),
              blockedUsers: [],
            };
            await setDoc(userRef, defaultProf);
          } else {
            await updateDoc(userRef, {
              online: true,
              lastSeen: serverTimestamp(),
            });
          }
        } catch (err) {
          console.error('Error updating presence:', err);
        }

        // Subscribe to real-time user profile updates
        unsubscribeProfile = onSnapshot(
          userRef,
          (snapshot) => {
            if (snapshot.exists()) {
              setUserProfile(snapshot.data() as UserProfile);
            }
          },
          (err) => {
            console.warn('User profile listener error:', err);
          }
        );
      } else {
        setUserProfile(null);
        if (unsubscribeProfile) unsubscribeProfile();
      }

      setLoading(false);
    });

    // Window unload / visibility change listener for presence
    const handleBeforeUnload = () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        updateDoc(userRef, {
          online: false,
          lastSeen: serverTimestamp(),
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const signUp = async (email: string, pass: string, name: string, photoFile?: File | null) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = res.user.uid;

      let photoURL = getDefaultAvatar(name, uid);

      if (photoFile) {
        try {
          const fileRef = ref(storage, `profiles/${uid}/${Date.now()}_${photoFile.name}`);
          await uploadBytes(fileRef, photoFile);
          photoURL = await getDownloadURL(fileRef);
        } catch (err) {
          console.warn('Storage upload failed, falling back to avatar:', err);
        }
      }

      const newProf: UserProfile = {
        uid,
        name,
        email,
        photoURL,
        about: 'Hey there! I am using WhatsApp Web.',
        online: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
        blockedUsers: [],
      };

      await setDoc(doc(db, 'users', uid), newProf);
    } catch (err: any) {
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/network-request-failed' ||
        err.code === 'auth/admin-restricted-operation' ||
        err.message?.includes('disabled')
      ) {
        console.warn('Email/Password auth restricted or network error. Auto-falling back to guest session.');
        await loginAsGuest(name || email.split('@')[0]);
        return;
      }
      throw err;
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/network-request-failed' ||
        err.code === 'auth/admin-restricted-operation' ||
        err.message?.includes('disabled')
      ) {
        console.warn('Email/Password auth restricted or network error. Auto-falling back to guest session.');
        await loginAsGuest(email.split('@')[0]);
        return;
      }
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginAsGuest = async (customName?: string) => {
    try {
      const res = await signInAnonymously(auth);
      const uid = res.user.uid;
      const name = customName || `Guest_${uid.slice(0, 5)}`;
      const userRef = doc(db, 'users', uid);
      
      const prof: UserProfile = {
        uid,
        name,
        email: `${uid.slice(0, 8)}@guest.local`,
        photoURL: getDefaultAvatar(name, uid),
        about: 'Hey there! I am using WhatsApp Web.',
        online: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
        blockedUsers: [],
      };
      await setDoc(userRef, prof, { merge: true });
    } catch (err: any) {
      if (
        err.code === 'auth/network-request-failed' ||
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/admin-restricted-operation' ||
        err.message?.includes('network')
      ) {
        const localUid = 'guest_' + Math.random().toString(36).substring(2, 9);
        const name = customName || `Guest_${localUid.slice(6, 11)}`;
        const localProf: UserProfile = {
          uid: localUid,
          name,
          email: `${localUid}@guest.local`,
          photoURL: getDefaultAvatar(name, localUid),
          about: 'Hey there! I am using WhatsApp Web.',
          online: true,
          lastSeen: new Date(),
          createdAt: new Date(),
          blockedUsers: [],
        };
        setUserProfile(localProf);
        setCurrentUser({ uid: localUid, email: localProf.email, displayName: name } as any);
        try {
          await setDoc(doc(db, 'users', localUid), localProf, { merge: true });
        } catch (_) {}
        return;
      }
      throw err;
    }
  };

  const logout = async () => {
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
          online: false,
          lastSeen: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn('Setting offline status on logout:', e);
      }
    }
    setCurrentUser(null);
    setUserProfile(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut error:', e);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfileData = async (updates: Partial<UserProfile>, photoFile?: File | null) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);

    let newPhotoURL = updates.photoURL;

    if (photoFile) {
      try {
        const fileRef = ref(storage, `profiles/${currentUser.uid}/${Date.now()}_${photoFile.name}`);
        await uploadBytes(fileRef, photoFile);
        newPhotoURL = await getDownloadURL(fileRef);
      } catch (err) {
        console.warn('Profile image upload error:', err);
      }
    }

    const payload: any = { ...updates };
    if (newPhotoURL) payload.photoURL = newPhotoURL;

    await setDoc(userRef, payload, { merge: true });
  };

  // Helper for 1-click Demo accounts for easy multi-user testing
  const demoLogin = async (demoEmail: string, demoName: string) => {
    const demoPassword = 'DemoPassword123!';
    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
    } catch (err: any) {
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/network-request-failed' ||
        err.code === 'auth/admin-restricted-operation'
      ) {
        await loginAsGuest(demoName);
        return;
      }

      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await signUp(demoEmail, demoPassword, demoName, null);
        } catch (signupErr: any) {
          if (
            signupErr.code === 'auth/operation-not-allowed' ||
            signupErr.code === 'auth/network-request-failed' ||
            signupErr.message?.includes('disabled')
          ) {
            await loginAsGuest(demoName);
          } else {
            throw signupErr;
          }
        }
      } else {
        throw err;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signUp,
        login,
        loginWithGoogle,
        loginAsGuest,
        logout,
        resetPassword,
        updateProfileData,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
