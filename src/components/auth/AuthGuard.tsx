'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no Firebase user, redirect to login.
    if (!loading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, loading, router]);

  // Show a loading spinner while auth state is being determined.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  // If we have the firebase user, we can render the protected children.
  // The inner layout/page will handle the case where the app user data is still loading.
  if (firebaseUser) {
    return <>{children}</>;
  }

  // If not loading and no user, we will be redirected by the effect, so we can return null.
  return null;
}
