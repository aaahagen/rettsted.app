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
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // A user is authenticated in Firebase. We are now in a loading state
        // until we can confirm their full profile from the database.
        setLoading(true);
        const userDocRef = doc(db, 'users', authUser.uid);

        let registrationTimeout: NodeJS.Timeout | null = null;

        const unsubscribeFirestore = onSnapshot(userDocRef, async (doc) => {
          // If a timeout was set, clear it now because we've received a database event.
          if (registrationTimeout) clearTimeout(registrationTimeout);

          if (doc.exists()) {
            // The user document exists. This is a fully authenticated and valid user.
            const tokenResult = await authUser.getIdTokenResult(true);
            setUser({ uid: doc.id, ...doc.data() } as AppUser);
            setClaims(tokenResult.claims);
            setLoading(false);
          } else {
            // The user document does NOT exist. This is the critical "race condition" state
            // that happens during registration.
            console.warn(`User document for ${authUser.uid} not found. Waiting for creation...`);
            
            // We will wait for 5 seconds for the document to be created by the server action.
            // If it's not created by then, we assume the registration failed and log the user out.
            registrationTimeout = setTimeout(() => {
              console.error("Timeout: User document was not created. Logging user out for safety.");
              setUser(null);
              setClaims(null);
              setLoading(false);
            }, 5000);
          }
        }, (error) => {
          console.error("Firestore listener error:", error);
          setUser(null);
          setClaims(null);
          setLoading(false);
        });

        return () => { // Cleanup function for the Firestore listener
          if (registrationTimeout) clearTimeout(registrationTimeout);
          unsubscribeFirestore();
        };

      } else {
        // No user is authenticated in Firebase.
        setUser(null);
        setClaims(null);
        setLoading(false);
      }
    });

    // Cleanup function for the main auth state listener
    return () => unsubscribeAuth();
  }, []); // Empty dependency array ensures this runs only once on mount.

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
