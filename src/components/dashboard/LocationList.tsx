'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
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
  const genericLocationImage = PlaceHolderImages.find(p => p.id === 'generic-location');

  useEffect(() => {
    const q = query(collection(db, 'locations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const locationsData: DeliveryLocation[] = [];
      querySnapshot.forEach((doc) => {
        locationsData.push({ id: doc.id, ...doc.data() } as DeliveryLocation);
      });
      setLocations(locationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLocations = useMemo(() => {
    return locations.filter(location => 
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [locations, searchTerm]);

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

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <LocationCardSkeleton key={i} />)}
        </div>
      )}

      {!loading && filteredLocations.length === 0 && (
         <div className="text-center py-16">
            <h3 className="text-xl font-semibold">Ingen treff</h3>
            <p className="text-muted-foreground">
                {searchTerm ? `Fant ingen steder som matchet "${searchTerm}".` : 'Det er ingen leveringssteder her enda.'}
            </p>
            <Button asChild variant="link" className="mt-4">
                <Link href="/dashboard/locations/new">Legg til det første stedet</Link>
            </Button>
         </div>
      )}

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
                Sist oppdatert: {location.lastUpdatedAt ? formatDistanceToNow(location.lastUpdatedAt.toDate(), { addSuffix: true, locale: nb }) : 'Aldri'}
               </p>
               <Button asChild className="w-full">
                <Link href={`/dashboard/locations/${location.id}`}>Se detaljer</Link>
               </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
