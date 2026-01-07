'use client';

import { GoogleMap, useLoadScript, MarkerF } from '@react-google-maps/api';
import { useMemo, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Navigation } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem',
};

interface LocationMapProps {
  address: string;
}

interface GeocodingResult {
  lat: number;
  lng: number;
}

async function getCoordinates(address: string): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export default function LocationMap({ address }: LocationMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [coords, setCoords] = useState<GeocodingResult | null>(null);
  const [loadingCoords, setLoadingCoords] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      getCoordinates(address).then(coordinates => {
        setCoords(coordinates);
        setLoadingCoords(false);
      });
    }
  }, [address, isLoaded]);

  const center = useMemo(() => coords, [coords]);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  if (loadError) return <div className="flex items-center justify-center h-full bg-muted rounded-lg"><p className="text-destructive-foreground">Kunne ikke laste kart</p></div>;
  if (!isLoaded || loadingCoords) return <Skeleton className="w-full h-full aspect-square" />;
  if (!center) return <div className="flex items-center justify-center h-full bg-muted rounded-lg"><p className="text-muted-foreground">Fant ikke adressen</p></div>;

  return (
    <div className="w-full h-full flex flex-col gap-2">
        <div className="w-full h-full">
            <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={15}
            options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: [
                {
                    "featureType": "poi",
                    "stylers": [{ "visibility": "off" }]
                },
                {
                    "featureType": "transit",
                    "stylers": [{ "visibility": "off" }]
                }
                ]
            }}
            >
            <MarkerF position={center} />
            </GoogleMap>
        </div>
         <Button asChild>
            <Link href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                <span>Åpne i Google Maps</span>
            </Link>
        </Button>
    </div>
  );
}
