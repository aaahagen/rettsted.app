'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { firebaseUser, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no Firebase user, redirect to login.
    if (!loading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, loading, router]);

  // Show a loading spinner while auth state is being determined.
  // OR if we have a firebase user, but are still waiting for the custom user data from firestore
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  // If we have the firebase user and the app user, render the protected children.
  return <>{children}</>;
}
