'use client';

import { doc, Timestamp, onSnapshot, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DeliveryLocation } from "@/lib/types";
import { notFound, useRouter, useParams } from "next/navigation"; // Bruker useParams hook
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit, Clock, User, Image as ImageIcon, Navigation, ParkingCircle, Truck, Info, Hourglass, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NextImage from 'next/image';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ImageUploader from "@/components/dashboard/ImageUploader";
import LocationMap from "@/components/maps/LocationMap";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth.tsx";


const InfoCard = ({ icon, title, content }: { icon: React.ReactNode, title: string, content?: string | null }) => {
    if (!content) return null;
    return (
        <div className="flex items-start gap-4">
            <div className="text-muted-foreground mt-1">{icon}</div>
            <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{content}</p>
            </div>
        </div>
    );
}

function LocationDetailSkeleton() {
    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-7 w-48" />
                <div className="flex-1" />
                <Skeleton className="h-9 w-24" />
            </div>
             <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2 grid gap-8">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-7 w-40" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                           {[...Array(5)].map((_, i) => (
                             <div className="flex items-start gap-4" key={i}>
                                <Skeleton className="h-6 w-6 mt-1 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-4 w-64" />
                                </div>
                            </div>
                           ))}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                             <Skeleton className="h-7 w-32" />
                        </CardHeader>
                        <CardContent>
                           <Skeleton className="w-full aspect-video" />
                        </CardContent>
                    </Card>
                </div>
                 <div className="md:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-7 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-5 w-48 mb-2" />
                            <Skeleton className="aspect-square w-full" />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <Skeleton className="h-7 w-20" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="flex items-center gap-3">
                                <Skeleton className="h-4 w-4" />
                                <div className="space-y-1">
                                     <Skeleton className="h-4 w-32" />
                                     <Skeleton className="h-3 w-24" />
                                </div>
                           </div>
                           <div className="flex items-center gap-3">
                                <Skeleton className="h-4 w-4" />
                                <div className="space-y-1">
                                     <Skeleton className="h-4 w-32" />
                                     <Skeleton className="h-3 w-24" />
                                </div>
                           </div>
                        </CardContent>
                    </Card>
                 </div>
             </div>
        </div>
    )
}

export default function LocationDetailPage() {
  const params = useParams(); // Bruker useParams for å hente ID trygt
  const id = params.id as string;
  const [location, setLocation] = useState<DeliveryLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const genericLocationImage = PlaceHolderImages.find(p => p.id === 'generic-location');

  useEffect(() => {
    if (!id || !user) {
        if (!user && !loading) {
             setLoading(false);
             setLocation(null);
        }
        return;
    }
    const docRef = doc(db, "locations", id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().organizationId === user.organizationId) {
        const data = docSnap.data();
        setLocation({
            id: docSnap.id,
            ...data,
            createdAt: (data.createdAt as Timestamp),
            lastUpdatedAt: data.lastUpdatedAt ? (data.lastUpdatedAt as Timestamp) : undefined,
        } as DeliveryLocation);
      } else {
        setLocation(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching location:", error);
      setLoading(false);
      setLocation(null);
    });

    return () => unsubscribe();
  }, [id, user]);


  const handleDelete = async () => {
    if (!location) return;
    try {
        await deleteDoc(doc(db, 'locations', location.id));
        toast({
            title: "Sted slettet",
            description: `Leveringsstedet "${location.name}" har blitt fjernet.`,
        });
        router.push('/dashboard');
    } catch (error) {
        console.error("Error deleting location:", error);
        toast({
            variant: "destructive",
            title: "Sletting feilet",
            description: "Kunne ikke slette leveringsstedet. Prøv igjen.",
        });
    }
  };


  if (loading) {
    return <LocationDetailSkeleton />;
  }

  if (!location) {
    return notFound();
  }
  
  const images = location.images && location.images.length > 0
    ? location.images
    : genericLocationImage
      ? [{ id: 'placeholder', url: genericLocationImage.imageUrl, caption: genericLocationImage.description, uploadedBy: '', uploadedAt: Timestamp.now() }]
      : [];


  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 font-headline">
          {location.name}
        </h1>
        <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            {location.lastUpdatedAt && (
                <>
                    <Clock className="h-4 w-4" />
                    <span>Sist oppdatert: {format(location.lastUpdatedAt.toDate(), "d. MMMM yyyy, HH:mm", { locale: nb })}</span>
                </>
            )}
        </div>
        <div className="flex items-center gap-2">
            <Button asChild>
                <Link href={`/dashboard/locations/${location.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" /> Rediger
                </Link>
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Slett
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Er du helt sikker?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Denne handlingen kan ikke angres. Dette vil permanent slette leveringsstedet <span className="font-semibold">{location.name}</span> og all tilknyttet data.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Ja, slett stedet</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 grid gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Stedsinformasjon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <InfoCard icon={<Hourglass />} title="Åpningstider" content={location.openingHours} />
                    <InfoCard icon={<Navigation />} title="Adkomst" content={location.accessNotes} />
                    <InfoCard icon={<ParkingCircle />} title="Parkering" content={location.parkingNotes} />
                    <InfoCard icon={<Truck />} title="Varemottak" content={location.receivingNotes} />
                    <InfoCard icon={<Info />} title="Spesielle Hensyn" content={location.specialConsiderations} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Bildegalleri</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="space-y-4">
                      <Carousel className="w-full">
                          <CarouselContent>
                              {images.map((image, index) => (
                                  <CarouselItem key={image.id || index}>
                                      <div className="p-1">
                                          <div className="aspect-video relative w-full rounded-lg overflow-hidden bg-muted">
                                             <NextImage 
                                                src={image.url} 
                                                alt={image.caption || `Bilde ${index + 1}`} 
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                style={{ objectFit: 'cover' }} 
                                                priority={index === 0}
                                                />
                                          </div>
                                          {image.caption && image.id !== 'placeholder' && <p className="text-sm text-muted-foreground mt-2 text-center">{image.caption}</p>}
                                      </div>
                                  </CarouselItem>
                              ))}
                          </CarouselContent>
                          {images.length > 1 && (
                            <>
                                <CarouselPrevious />
                                <CarouselNext />
                            </>
                          )}
                      </Carousel>
                       {location && (
                        <div className="border-t pt-4 flex justify-center">
                            <ImageUploader locationId={location.id} />
                        </div>
                       )}
                  </div>
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Adresse</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground">{location.address}</p>
                     <div className="mt-4 aspect-square w-full rounded-lg overflow-hidden">
                         <LocationMap address={location.address} />
                     </div>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <CardTitle className="font-headline">Historikk</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p>Opprettet av {location.createdBy.name}</p>
                            <p className="text-muted-foreground">{location.createdAt && format(location.createdAt.toDate(), "d. MMMM yyyy", { locale: nb })}</p>
                        </div>
                    </div>
                    {location.lastUpdatedBy && location.lastUpdatedAt && (
                        <div className="flex items-center gap-3">
                            <Edit className="h-4 w-4 text-muted-foreground" />
                             <div>
                                <p>Sist endret av {location.lastUpdatedBy.name}</p>
                                <p className="text-muted-foreground">{format(location.lastUpdatedAt!.toDate(), "d. MMMM yyyy", { locale: nb })}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
