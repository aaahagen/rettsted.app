'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type IdTokenResult, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  claims: IdTokenResult['claims'] | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [claims, setClaims] = useState<IdTokenResult['claims'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUser = (authUser: FirebaseUser | null) => {
      setLoading(true);

      if (authUser) {
        // Use onSnapshot to listen for the document creation/update in real-time
        const userDocRef = doc(db, 'users', authUser.uid);
        const unsubscribe = onSnapshot(userDocRef, async (doc) => {
          if (doc.exists()) {
            const tokenResult = await authUser.getIdTokenResult(true);
            setClaims(tokenResult.claims);
            setUser({ uid: doc.id, ...doc.data() } as AppUser);
            setLoading(false);
          } else {
            // This case can happen during registration before the user doc is created.
            // We set loading to false but user to null. The registration flow should handle the redirect.
            // For a normal login, if the doc is missing, it's an error state.
             console.warn(`User document for ${authUser.uid} not found.`);
             setUser(null);
             setClaims(null);
             setLoading(false);
          }
        }, (error) => {
          console.error("Firestore snapshot error:", error);
          setUser(null);
          setClaims(null);
          setLoading(false);
        });
        
        // Return the cleanup function for the snapshot listener
        return unsubscribe;

      } else {
        // No authenticated user from Firebase Auth
        setUser(null);
        setClaims(null);
        setLoading(false);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, handleUser);

    // Cleanup function for the auth state listener
    return () => unsubscribeAuth();
  }, []); // <-- The dependency array is now empty

  const value = { user, loading, claims };

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
