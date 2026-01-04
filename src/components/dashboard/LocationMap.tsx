'use client';

import { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useLoadScript, MarkerF } from '@react-google-maps/api';
import { Skeleton } from '../ui/skeleton';

interface LocationMapProps {
  address: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem', // Corresponds to rounded-lg
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
}

export default function LocationMap({ address }: LocationMapProps) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const libraries = useMemo(() => ['places'] as any, []);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  useEffect(() => {
    if (!isLoaded || !address) {
        if (isLoaded && !address) {
            setError("Ingen adresse spesifisert.");
            setLoading(false);
        }
      return;
    };

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
      setLoading(false);
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        setCoordinates({ lat: location.lat(), lng: location.lng() });
        setError(null);
      } else {
        console.error(`Geocode was not successful for the following reason: ${status}`);
        setError(`Kunne ikke finne adressen på kartet. (${status})`);
        setCoordinates(null);
      }
    });
  }, [isLoaded, address]);

  if (loadError) {
      return <div className="text-destructive">Feil ved lasting av kart: {loadError.message}</div>;
  }
  
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      return (
        <div className="aspect-square w-full bg-muted rounded-lg flex flex-col items-center justify-center text-center p-4">
            <p className="text-sm font-semibold text-destructive">Google Maps API-nøkkel mangler</p>
            <p className="text-xs text-muted-foreground mt-1">Legg til NEXT_PUBLIC_GOOGLE_MAPS_API_KEY i .env.local-filen din.</p>
        </div>
      )
  }

  if (loading || !isLoaded) {
    return <Skeleton className="aspect-square w-full" />;
  }

  if (error) {
    return (
        <div className="aspect-square w-full bg-muted rounded-lg flex items-center justify-center text-center p-4">
            <p className="text-sm text-muted-foreground">{error}</p>
        </div>
    );
  }

  return (
    <div className="aspect-square w-full">
        {coordinates && (
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={coordinates}
                zoom={15}
                options={mapOptions}
            >
                <MarkerF position={coordinates} />
            </GoogleMap>
        )}
    </div>
  );
}
