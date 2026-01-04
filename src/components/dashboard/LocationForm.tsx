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
import { createOrUpdateLocation } from '@/lib/actions';
import { useAuthContext } from '@/hooks/use-auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
  const { user, loading } = useAuthContext();
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
        toast({ variant: 'destructive', title: 'Du er ikke logget inn.' });
        return;
    }
    
    try {
        const result = await createOrUpdateLocation(values, user, location?.id);
        toast({ title: 'Suksess!', description: `Leveringssted ${location ? 'oppdatert' : 'opprettet'}.` });
        router.push(`/dashboard/locations/${result.id}`);
        router.refresh();
    } catch(error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Noe gikk galt', description: 'Kunne ikke lagre endringene.' });
    }
  };
  
  const isSubmitting = form.formState.isSubmitting || loading;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit(onSubmit)();
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-8">
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
                  <FormDescription>
                    Når er det mulig å levere varer?
                  </FormDescription>
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
                  <FormDescription>
                    Er det spesielle kjøreruter, trange gater eller andre hindringer?
                  </FormDescription>
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
                   <FormDescription>
                    Er det dedikerte plasser, fare for bot, eller andre ting å vite?
                  </FormDescription>
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
                  <FormDescription>
                    Hvor er døren? Trengs det nøkkelkort? Hvem skal man kontakte?
                  </FormDescription>
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
                  <FormDescription>
                    Stilleområder, spesielle tider, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>Avbryt</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <LoadingSpinner /> : (location ? 'Lagre endringer' : 'Opprett sted')}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
