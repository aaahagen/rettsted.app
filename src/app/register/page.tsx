'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { RettStedLogo } from '@/components/icons';
import LoadingSpinner from '@/components/ui/loading-spinner';

const Logo = () => (
    <Link href="/" className="flex items-center gap-2 text-foreground">
        <RettStedLogo className="h-14 w-auto" />
    </Link>
);


export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("1: submit startet");

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("2: auth user", user?.uid);

      // 2. Update Firebase Auth profile
      await updateProfile(user, { displayName: name });

      // 3. Create user document in Firestore using the guaranteed user object
      const userDocRef = doc(db, 'users', user.uid);
      console.log("3: før firestore");
      await setDoc(userDocRef, {
        displayName: name,
        email: email,
        role: 'driver', // Default role for new users
        createdAt: serverTimestamp(),
      });
      console.log("4: etter firestore");
      
      toast({
        title: 'Registrering vellykket',
        description: 'Videresender til dashbord...',
      });
      
      router.push('/dashboard');
      console.log("5: redirect ferdig");

    } catch (error: any) {
      console.error("Registreringsfeil:", error);
      let errorMessage = 'En ukjent feil oppstod. Prøv igjen.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Denne e-postadressen er allerede i bruk.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Passordet er for svakt. Bruk minst 6 tegn.';
      } else if (error.message.includes('permission-denied') || error.code === 'permission-denied') {
        errorMessage = 'Databasefeil: Ingen tilgang til å opprette bruker. Sjekk sikkerhetsregler.'
      }
      toast({
        variant: 'destructive',
        title: 'Feil ved registrering',
        description: errorMessage,
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
            <Logo />
          </div>
          <CardTitle className="text-2xl text-center">Opprett en konto</CardTitle>
          <CardDescription className="text-center">
            Fyll inn detaljene under for å komme i gang.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Fullt navn</Label>              <Input 
                id="name" 
                placeholder="Ola Normann" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
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
              <Label htmlFor="password">Passord</Label>
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
              {isLoading ? <LoadingSpinner /> : 'Opprett konto'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Har du allerede en konto?{' '}
            <Link href="/login" className="underline">
              Logg inn
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
