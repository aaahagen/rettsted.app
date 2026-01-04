'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { RettStedLogo } from '../icons';
import { UserNav } from './UserNav';

const Logo = () => (
    <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
      <RettStedLogo className="h-10 w-auto" />
    </Link>
);


export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashbord' },
    { href: '/dashboard/locations/new', icon: PlusCircle, label: 'Ny Lokasjon' },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === path;
    return pathname.startsWith(path);
  };
  
  return (
    <div className="flex h-full max-h-screen flex-col">
      <div className="flex h-16 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Logo />
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                isActive(item.href) && 'bg-muted text-primary'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center justify-between">
           <UserNav />
        </div>
      </div>
    </div>
  );
}
