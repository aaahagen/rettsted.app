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
  const [authState, setAuthState] = useState<{
      user: AppUser | null;
      claims: IdTokenResult['claims'] | null;
      loading: boolean;
  }>({
      user: null,
      claims: null,
      loading: true
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setAuthState(prev => ({ ...prev, loading: true }));
        const userDocRef = doc(db, 'users', authUser.uid);

        let registrationTimeout: NodeJS.Timeout | null = null;

        const unsubscribeFirestore = onSnapshot(userDocRef, async (doc) => {
          if (registrationTimeout) clearTimeout(registrationTimeout);

          if (doc.exists()) {
            // CRITICAL FIX: Fetch token and document data, then update state ATOMICALLY.
            try {
                const tokenResult = await authUser.getIdTokenResult(true);
                const userData = { uid: doc.id, ...doc.data() } as AppUser;
                
                // One single state update prevents partial information from reaching components.
                setAuthState({
                    user: userData,
                    claims: tokenResult.claims,
                    loading: false
                });
            } catch (error) {
                console.error("Error updating auth state:", error);
                setAuthState({ user: null, claims: null, loading: false });
            }
          } else {
            // Wait for registration if doc doesn't exist yet
            registrationTimeout = setTimeout(() => {
              console.error("Timeout waiting for user document.");
              setAuthState({ user: null, claims: null, loading: false });
            }, 5000);
          }
        }, (error) => {
          console.error("Firestore listener error:", error);
          setAuthState({ user: null, claims: null, loading: false });
        });

        return () => {
          if (registrationTimeout) clearTimeout(registrationTimeout);
          unsubscribeFirestore();
        };

      } else {
        setAuthState({ user: null, claims: null, loading: false });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={authState}>
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
