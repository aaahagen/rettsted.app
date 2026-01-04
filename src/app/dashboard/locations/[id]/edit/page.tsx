import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LocationForm } from "@/components/dashboard/LocationForm";
import type { DeliveryLocation } from "@/lib/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";


async function getLocation(id: string): Promise<DeliveryLocation | null> {
  const docRef = doc(db, "locations", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }
  const data = docSnap.data();
  // Firestore timestamps need to be converted to a serializable format for client components
  const serializableData = {
      ...data,
      createdAt: data.createdAt.toDate().toISOString(),
      lastUpdatedAt: data.lastUpdatedAt ? data.lastUpdatedAt.toDate().toISOString() : undefined,
  };
  
  return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt as Timestamp,
      lastUpdatedAt: data.lastUpdatedAt ? (data.lastUpdatedAt as Timestamp) : undefined,
  } as DeliveryLocation;
}


export default async function EditLocationPage({ params }: { params: { id: string } }) {
  const location = await getLocation(params.id);

  if (!location) {
    notFound();
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
