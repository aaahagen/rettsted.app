'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no Firebase user, redirect to login.
    if (!loading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, loading, router]);

  // Show a loading spinner while auth state is being determined,
  // or if we have a Firebase user but are still waiting for the app user data from Firestore.
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  // If we have the user data, render the protected children.
  return <>{children}</>;
}
