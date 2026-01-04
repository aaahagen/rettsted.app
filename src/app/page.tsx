import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, MapPin, Camera, Users } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { RoutemateIcon } from '@/components/icons';

const features = [
  {
    icon: <MapPin className="h-8 w-8 text-primary" />,
    title: 'Stedsspesifikk Info',
    description: 'All kritisk leveringsinformasjon, som adkomst og parkering, samlet på ett sted.',
  },
  {
    icon: <Camera className="h-8 w-8 text-primary" />,
    title: 'Visuell Dokumentasjon',
    description: 'Ta og del bilder av varemottak, dører og hindringer for å unngå misforståelser.',
  },
  {
    icon: <Truck className="h-8 w-8 text-primary" />,
    title: 'Raskere Leveranser',
    description: 'Reduser tid per stopp og unngå feil med forutsigbar og lett tilgjengelig informasjon.',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Kunnskapsoverføring',
    description: 'Sørg for at nyansatte og vikarer presterer fra dag én med en levende digital håndbok.',
  },
];

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'delivery-truck-city');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <RoutemateIcon className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold font-headline">Routemate</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            Logg inn
          </Link>
          <Button asChild>
            <Link href="/register">Registrer deg</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="w-full pt-24 md:pt-32 lg:pt-40 relative">
          <div className="container px-4 md:px-6 grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                  Smartere leveranser, gladere sjåfører.
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Routemate er den digitale håndboken som gir sjåførene dine all informasjonen de trenger for raske og problemfrie leveranser, rett i lomma.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link href="/register">Kom i gang gratis</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  width={600}
                  height={400}
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                  data-ai-hint={heroImage.imageHint}
                />
              )}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Nøkkelfunksjoner</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Effektivitet i hver leveranse</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Gi sjåførene verktøyene de trenger for å lykkes. Fra detaljerte adkomstbeskrivelser til visuell dokumentasjon, alt er designet for å gjøre arbeidsdagen enklere.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
              {features.map((feature, index) => (
                <Card key={index} className="h-full">
                  <CardHeader className="flex flex-col items-center text-center">
                    {feature.icon}
                    <CardTitle className="mt-4 font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-muted-foreground">
                    {feature.description}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                Klar for å transformere dine leveranser?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Slutt å kaste bort tid. Gi teamet ditt den operative kunnskapen de trenger for å levere perfekt, hver gang.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button asChild size="lg" className="w-full">
                <Link href="/register">Start din gratis prøveperiode</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Routemate. Alle rettigheter reservert.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Vilkår
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Personvern
          </Link>
        </nav>
      </footer>
    </div>
  );
}
