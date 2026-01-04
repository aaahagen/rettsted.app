import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DeliveryLocation } from "@/lib/types";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit, Clock, User, Image as ImageIcon, Navigation, ParkingCircle, Truck, Info, Hourglass } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NextImage from 'next/image';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

async function getLocation(id: string): Promise<DeliveryLocation | null> {
  const docRef = doc(db, "locations", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }
  const data = docSnap.data();
  // Firestore timestamps need to be converted to a serializable format
  return {
      id: docSnap.id,
      ...data,
      createdAt: (data.createdAt as Timestamp),
      lastUpdatedAt: data.lastUpdatedAt ? (data.lastUpdatedAt as Timestamp) : undefined,
  } as DeliveryLocation;
}

const InfoCard = ({ icon, title, content }: { icon: React.ReactNode, title: string, content?: string }) => {
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

export default async function LocationDetailPage({ params }: { params: { id: string } }) {
  const location = await getLocation(params.id);

  if (!location) {
    notFound();
  }
  
  const alleyImage = PlaceHolderImages.find(p => p.id === 'alley-way');

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
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
        <Button asChild>
            <Link href={`/dashboard/locations/${location.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" /> Rediger
            </Link>
        </Button>
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
                    {location.images && location.images.length > 0 ? (
                        <Carousel className="w-full">
                            <CarouselContent>
                                {location.images.map((image, index) => (
                                    <CarouselItem key={index}>
                                        <div className="p-1">
                                            <div className="aspect-video relative w-full rounded-lg overflow-hidden bg-muted">
                                                <NextImage src={image.url} alt={image.caption || `Bilde ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                                            </div>
                                            {image.caption && <p className="text-sm text-muted-foreground mt-2 text-center">{image.caption}</p>}
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    ) : (
                        <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
                            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">Ingen bilder</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Det er ikke lastet opp noen bilder for dette stedet enda.
                            </p>
                            <Button variant="secondary" className="mt-4">
                                Last opp bilde
                            </Button>
                        </div>
                    )}
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
                     {/* Placeholder for map */}
                     <div className="mt-4 aspect-square w-full bg-muted rounded-lg flex items-center justify-center">
                         <p className="text-sm text-muted-foreground">Kart kommer her</p>
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
                            <p className="text-muted-foreground">{format(location.createdAt.toDate(), "d. MMMM yyyy", { locale: nb })}</p>
                        </div>
                    </div>
                    {location.lastUpdatedBy && (
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
