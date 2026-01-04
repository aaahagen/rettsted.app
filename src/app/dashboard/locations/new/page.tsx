import { LocationForm } from "@/components/dashboard/LocationForm";

export default function NewLocationPage() {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Opprett Nytt Leveringssted</h1>
      </div>
      <div className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm p-4 md:p-8 bg-background">
        <LocationForm />
      </div>
    </>
  );
}
