'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, where, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DeliveryLocation } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Search, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import LoadingSpinner from '../ui/loading-spinner';

function LocationCardSkeleton() {
  return (
    <Card className="h-[350px]">
      <CardHeader className="h-24">
        <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded mt-2" />
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="w-full h-full bg-muted animate-pulse rounded-md" />
      </CardContent>
    </Card>
  );
}

export default function LocationList() {
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, loading: authLoading } = useAuth();
  const genericLocationImage = PlaceHolderImages.find(p => p.id === 'generic-location');

  useEffect(() => {
    // 1. If auth is still loading, do nothing yet.
    if (authLoading) return;

    // 2. If no user, we can't fetch anything.
    if (!user) {
        setLoading(false);
        return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
        setLoading(true);
        try {
            // We use the organizationId from the user object. 
            // In our system, this is reliable enough as it's fetched from the user doc in useAuth.
            const orgId = user.organizationId;

            if (!orgId) {
                if (isMounted) setLoading(false);
                return;
            }

            const q = query(
                collection(db, 'locations'),
                where('organizationId', '==', orgId)
            );

            // Start real-time listener
            unsubscribe = onSnapshot(q, (snapshot) => {
                if (!isMounted) return;

                const locationsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt as Timestamp,
                } as DeliveryLocation));
                
                locationsData.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis() || 0;
                    const timeB = b.createdAt?.toMillis() || 0;
                    return timeB - timeA;
                });

                setLocations(locationsData);
                setLoading(false);
            }, (err) => {
                console.error("Firestore error in LocationList:", err);
                if (isMounted) setLoading(false);
            });

        } catch (error) {
            console.error("Setup error in LocationList:", error);
            if (isMounted) setLoading(false);
        }
    };

    init();

    // 3. CLEANUP: This is the most important part to prevent Application Errors.
    return () => {
        isMounted = false;
        if (unsubscribe) unsubscribe();
    };
  }, [user, authLoading]);

  const filteredLocations = useMemo(() => {
    if (!searchTerm) return locations;
    const lowerSearch = searchTerm.toLowerCase();
    return locations.filter(loc => 
        loc.name.toLowerCase().includes(lowerSearch) || 
        loc.address.toLowerCase().includes(lowerSearch)
    );
  }, [locations, searchTerm]);

  if (authLoading || (loading && locations.length === 0)) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!loading && locations.length === 0) {
      return (
        <div className="text-center py-20 bg-muted/30 rounded-xl border-2 border-dashed">
          <h3 className="text-xl font-semibold">Ingen leveringssteder ennå</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Opprett ditt første leveringssted for å se det her.
          </p>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk på navn eller adresse..."
          className="pl-9 h-11"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredLocations.map(location => (
          <Card key={location.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="p-4">
              <CardTitle className="font-headline text-lg truncate">{location.name}</CardTitle>
              <CardDescription className="truncate text-xs">{location.address}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 px-4 flex-grow">
              <div className="aspect-[4/3] rounded-md overflow-hidden bg-muted border relative">
                <Image
                  src={location.images?.[0]?.url || genericLocationImage?.imageUrl || ""}
                  alt={location.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
            </CardContent>
            <CardFooter className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{location.createdAt ? formatDistanceToNow(location.createdAt.toDate(), { addSuffix: true, locale: nb }) : 'Ukjent'}</span>
              </div>
              <Button asChild className="w-full h-9">
                <Link href={`/dashboard/locations/${location.id}`}>Se detaljer</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
