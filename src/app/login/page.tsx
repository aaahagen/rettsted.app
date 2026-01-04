'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { RettStedIcon } from '@/components/icons';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Innlogging vellykket',
        description: 'Velkommen tilbake!',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Feil ved innlogging',
        description: 'Ugyldig e-post eller passord. Prøv igjen.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Link href="/" className="flex items-center gap-2 text-foreground">
              <RettStedIcon className="h-6 w-6" />
              <span className="text-xl font-bold uppercase">Rett Sted</span>
            </Link>
          </div>
          <CardTitle className="text-2xl text-center">Logg inn</CardTitle>
          <CardDescription className="text-center">
            Skriv inn e-post og passord for å få tilgang til dashbordet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                placeholder="ola@normann.no"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Passord</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline">
                  Glemt passord?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <LoadingSpinner /> : 'Logg inn'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Har du ikke en konto?{' '}
            <Link href="/register" className="underline">
              Registrer deg
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
