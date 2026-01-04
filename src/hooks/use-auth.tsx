'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';
import LoadingSpinner from '@/components/ui/loading-spinner';

export interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setFirebaseUser(authUser);
      if (authUser) {
        // If we have an authenticated user, we are still loading until we get their Firestore document.
        setLoading(true);
        const userDocRef = doc(db, 'users', authUser.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUser({ uid: doc.id, ...doc.data() } as AppUser);
          } else {
            // This case might happen if a user is deleted from Firestore but not Auth
            setUser(null);
          }
          setLoading(false); // Loading is false only after Firestore check
        }, (error) => {
          console.error("Error fetching user document:", error);
          setUser(null);
          setLoading(false);
        });
        // Return the firestore unsubscribe function to be called when auth state changes
        return unsubscribeFirestore;
      } else {
        // No authenticated user, so we are not loading and have no user.
        setUser(null);
        setFirebaseUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const value = { firebaseUser, user, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
