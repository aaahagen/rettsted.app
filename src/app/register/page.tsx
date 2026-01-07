'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { RettStedLogo } from '@/components/icons';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { registerAndCreateOrg } from '@/lib/actions'; // Import the server action

const Logo = () => (
    <Link href="/" className="flex items-center gap-2 text-foreground">
        <RettStedLogo className="h-14 w-auto" />
    </Link>
);

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName) {
        toast({
            variant: 'destructive',
            title: 'Mangler organisasjonsnavn',
            description: 'Vennligst fyll ut navnet på organisasjonen.',
        });
        return;
    }
    setIsLoading(true);

    try {
      // Step 1: Create the user in Firebase Authentication on the client-side.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Update the user's display name in Firebase Auth.
      await updateProfile(user, { displayName: name });
      
      // Step 3: Call the server action to perform secure operations.
      // This will create the Firestore documents and set the critical custom claim.
      const result = await registerAndCreateOrg({
        uid: user.uid,
        email: user.email!,
        name: name,
        organizationName: organizationName,
      });

      if (!result.success) {
        throw new Error(result.error || 'En ukjent serverfeil oppstod.');
      }
      
      toast({
        title: 'Registrering vellykket',
        description: 'Videresender til dashbord...',
      });
      
      // Force a token refresh to ensure the new custom claims are applied immediately.
      await user.getIdToken(true);
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Registreringsfeil:", error);
      let errorMessage = 'En ukjent feil oppstod. Prøv igjen.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Denne e-postadressen er allerede i bruk.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Passordet er for svakt. Bruk minst 6 tegn.';
      } else {
        errorMessage = error.message;
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
            Fyll inn detaljene under for å komme i gang med din organisasjon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="grid gap-4">
             <div className="grid gap-2">
              <Label htmlFor="organizationName">Navn på organisasjon</Label>
              <Input 
                id="organizationName" 
                placeholder="Raske Gutter AS" 
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Ditt fulle navn</Label>
              <Input 
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
              {isLoading ? <LoadingSpinner /> : 'Opprett konto og organisasjon'}
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
