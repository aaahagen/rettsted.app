'use client';

import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LocationForm } from "@/components/dashboard/LocationForm";
import type { DeliveryLocation } from "@/lib/types";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";


export default function EditLocationPage({ params }: { params: { id: string } }) {
  const [location, setLocation] = useState<DeliveryLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function getLocation() {
      try {
        const docRef = doc(db, "locations", params.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError(true);
          return;
        }
        
        const data = docSnap.data();
        setLocation({
            id: docSnap.id,
            ...data,
            createdAt: (data.createdAt as Timestamp),
            lastUpdatedAt: data.lastUpdatedAt ? (data.lastUpdatedAt as Timestamp) : undefined,
        } as DeliveryLocation);

      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    
    getLocation();
  }, [params.id]);

  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  if (error) {
    notFound();
  }
  
  if (!location) {
      return notFound();
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href={`/dashboard/locations/${location.id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Rediger Leveringssted</h1>
      </div>
      <div className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm p-4 md:p-8 bg-background">
        <LocationForm location={location} />
      </div>
    </>
  );
}
