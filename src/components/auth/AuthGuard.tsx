'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's still no user, redirect to login.
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Show a loading spinner while auth state and user data are being determined.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  // If loading is finished and we have a user, render the protected children.
  if (user) {
    return <>{children}</>;
  }

  // If not loading and no user, we will be redirected by the effect, so we can return null.
  // This prevents a flash of the children before the redirect happens.
  return null;
}
