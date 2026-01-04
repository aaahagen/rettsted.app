import Link from 'next/link';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { UserNav } from './UserNav';
import { AppSidebar } from './AppSidebar';
import { RettStedIcon } from '../icons';

const Logo = () => (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 text-lg font-semibold md:text-base"
    >
      <RettStedIcon className="h-6 w-6" />
       <span className="text-xl font-bold font-headline text-primary">
        Rett<span className="text-accent">St</span>ed
      </span>
    </Link>
);


export function Header() {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-30">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Logo />
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <AppSidebar />
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          {/* Search can go here later */}
        </div>
        <UserNav />
      </div>
    </header>
  );
}
