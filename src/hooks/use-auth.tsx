'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // If we have an auth user, we are loading until we get the Firestore doc.
        setLoading(true);
        const userDocRef = doc(db, 'users', authUser.uid);
        
        const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            // We got the user document, set the user and stop loading.
            setUser({ uid: doc.id, ...doc.data() } as AppUser);
            setLoading(false);
          } else {
            // This case might happen if a user is deleted from Firestore but not Auth.
            // Or on first registration before doc is created.
            // We'll clear the user and let the AuthGuard handle it.
            setUser(null);
            setLoading(false); 
          }
        }, (error) => {
          console.error("Error fetching user document:", error);
          setUser(null);
          setLoading(false);
        });

        // This is returned by onAuthStateChanged to clean up the Firestore listener 
        // when the auth state changes again.
        return unsubscribeFirestore;
      } else {
        // No authenticated user, so we are not loading and have no user.
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup the auth subscription on unmount
    return () => unsubscribeAuth();
  }, []);

  const value = { user, loading };

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
