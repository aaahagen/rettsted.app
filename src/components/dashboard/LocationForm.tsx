'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { DeliveryLocation } from '@/lib/types';
import LoadingSpinner from '../ui/loading-spinner';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Navn må ha minst 2 tegn.' }),
  address: z.string().min(5, { message: 'Adresse må ha minst 5 tegn.' }),
  openingHours: z.string().optional(),
  accessNotes: z.string().optional(),
  parkingNotes: z.string().optional(),
  receivingNotes: z.string().optional(),
  specialConsiderations: z.string().optional(),
});

type LocationFormValues = z.infer<typeof formSchema>;

interface LocationFormProps {
  location?: DeliveryLocation;
}

export function LocationForm({ location }: LocationFormProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: location?.name || '',
      address: location?.address || '',
      openingHours: location?.openingHours || '',
      accessNotes: location?.accessNotes || '',
      parkingNotes: location?.parkingNotes || '',
      receivingNotes: location?.receivingNotes || '',
      specialConsiderations: location?.specialConsiderations || '',
    },
  });

  const onSubmit = async (values: LocationFormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Du må være logget inn.' });
        return;
    }
    
    try {
        // NEW ROBUST APPROACH: Get the organization ID directly from the user document
        // to be absolutely sure we link the location correctly.
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (!userSnap.exists()) {
            throw new Error("Fant ikke din brukerprofil i databasen.");
        }
        
        const userData = userSnap.data();
        const orgId = userData.organizationId;
        const orgName = userData.organizationName || '';

        if (!orgId) {
            throw new Error("Din bruker er ikke tilknyttet noen organisasjon.");
        }

        let locationId = location?.id;

        if (locationId) {
            // Update
            const locationRef = doc(db, 'locations', locationId);
            await setDoc(locationRef, {
                ...values,
                lastUpdatedBy: {
                    uid: user.uid,
                    name: user.displayName || 'Ukjent bruker',
                },
                lastUpdatedAt: serverTimestamp(),
            }, { merge: true });
        } else {
            // Create
            const newLocationRef = await addDoc(collection(db, 'locations'), {
                ...values,
                organizationId: orgId, // Verifisert ID
                organizationName: orgName,
                images: [],
                createdBy: {
                    uid: user.uid,
                    name: user.displayName || 'Ukjent bruker',
                },
                createdAt: serverTimestamp(),
            });
            locationId = newLocationRef.id;
        }
        
        toast({ title: 'Suksess!', description: `Leveringssted ${location ? 'oppdatert' : 'opprettet'}.` });
        router.push(`/dashboard/locations/${locationId}`);
        router.refresh();

    } catch(error: any) {
        console.error("Feil ved lagring:", error);
        toast({ 
            variant: 'destructive', 
            title: 'Kunne ikke lagre', 
            description: error.message || 'En ukjent feil oppstod.' 
        });
    }
  };
  
  const isSubmitting = form.formState.isSubmitting || authLoading;
  
  return (
    <Card className="w-full max-w-3xl border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Navn på sted</FormLabel>
                    <FormControl>
                        <Input placeholder="F.eks. Sentrum Scene" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                        <Input placeholder="Arbeidersamfunnets plass 1, 0181 Oslo" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="openingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Åpningstider for varemottak</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Man-Fre 08:00-16:00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="accessNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adkomst</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Beskriv veien inn til leveringspunktet..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="parkingNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parkering</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Hvor kan man parkere under levering?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="receivingNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Varemottak</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detaljer om selve varemottaket..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="specialConsiderations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spesielle hensyn</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Er det noe annet man bør vite?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 border-t pt-6">
                <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>Avbryt</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                  {location ? 'Lagre endringer' : 'Opprett sted'}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
