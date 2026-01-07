'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DeliveryLocation } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import LoadingSpinner from '../ui/loading-spinner';

function LocationCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full aspect-[4/3] rounded-md" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

export default function LocationList() {
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, claims, loading: authLoading } = useAuth();
  const genericLocationImage = PlaceHolderImages.find(p => p.id === 'generic-location');

  useEffect(() => {
    // Ensure we have the user's organization ID from the custom claims before querying.
    const orgId = claims?.organizationId as string;
    if (!orgId) {
      if (!authLoading) {
        setLoading(false); // Stop loading if auth is checked and there's no orgId
      }
      return;
    }

    setLoading(true);
    // **This is the corrected query**: It now filters locations by the user's organizationId.
    const q = query(
      collection(db, 'locations'),
      where('organizationId', '==', orgId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const locationsData: DeliveryLocation[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp,
        lastUpdatedAt: doc.data().lastUpdatedAt as Timestamp,
      } as DeliveryLocation));
      
      setLocations(locationsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching locations: ", error);
      // This error likely means the Firestore rules are incorrect or the index is missing.
      setLoading(false);
    });

    return () => unsubscribe();
  }, [claims, authLoading]); // Rerun effect if claims or authLoading changes

  const filteredLocations = useMemo(() => {
    if (!searchTerm) {
      return locations;
    }
    return locations.filter(location =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [locations, searchTerm]);

  if (authLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk på navn eller adresse..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <LocationCardSkeleton key={i} />)}
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="text-center py-16 bg-background rounded-lg border border-dashed">
          <h3 className="text-xl font-semibold">Ingen leveringssteder funnet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-2">
            {searchTerm
              ? `Fant ingen steder som matchet "${searchTerm}".`
              : 'Din organisasjon har ikke lagt til noen leveringssteder. Bli den første til å legge til et!'}
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/locations/new">Legg til nytt leveringssted</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLocations.map(location => (
            <Card key={location.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline truncate">{location.name}</CardTitle>
                <CardDescription className="truncate">{location.address}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="aspect-[4/3] rounded-md overflow-hidden bg-muted">
                  <Image
                    src={location.images?.[0]?.url || genericLocationImage?.imageUrl || "https://picsum.photos/seed/placeholder/200/150"}
                    alt={location.name}
                    width={200}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4">
                <p className="text-xs text-muted-foreground">
                  Sist oppdatert: {formatDistanceToNow(location.createdAt.toDate(), { addSuffix: true, locale: nb })}
                </p>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/locations/${location.id}`}>Se detaljer</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
