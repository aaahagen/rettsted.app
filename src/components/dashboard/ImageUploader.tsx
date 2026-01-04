'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/hooks/use-auth';
import { UploadCloud } from 'lucide-react';
import LoadingSpinner from '../ui/loading-spinner';

interface ImageUploaderProps {
  locationId: string;
}

export default function ImageUploader({ locationId }: ImageUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Ikke autentisert',
        description: 'Du må være logget inn for å laste opp bilder.',
      });
      return;
    }
    
    if (!locationId) {
      toast({
        variant: 'destructive',
        title: 'Mangler Sted ID',
        description: 'Kan ikke laste opp bilde uten en gyldig ID for stedet.',
      });
      return;
    }

    setUploading(true);

    console.log("Startet opplasting...");
    console.log("File:", file.name, file.size);
    console.log("User UID:", user.uid);
    console.log("Uploading to locationId:", locationId);

    try {
      // 1. Lag en unik filreferanse i Firebase Storage
      const fileId = uuidv4();
      const fileExtension = file.name.split('.').pop();
      const storagePath = `locations/${locationId}/${fileId}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);

      // 2. Last opp filen til Storage
      console.log(`Laster opp til: ${storagePath}`);
      await uploadBytes(storageRef, file);
      console.log("Filopplasting til Storage var vellykket.");

      // 3. Hent nedlastings-URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Hentet Download URL:", downloadURL);

      // 4. Forbered data for Firestore
      const locationRef = doc(db, 'locations', locationId);
      const newImage = {
        id: fileId,
        url: downloadURL,
        caption: '', 
        uploadedBy: user.uid,
        uploadedAt: serverTimestamp(),
      };

      // 5. Oppdater Firestore-dokumentet med setDoc og merge: true (ROBUST METODE)
      console.log("Oppdaterer Firestore med setDoc({ merge: true }).");
      await setDoc(locationRef, {
        images: arrayUnion(newImage),
        lastUpdatedAt: serverTimestamp(),
        lastUpdatedBy: {
          uid: user.uid,
          name: user.displayName || 'Ukjent Bruker',
        }
      }, { merge: true });
      console.log("Firestore-oppdatering var vellykket.");

      toast({
        title: 'Bilde lastet opp!',
        description: 'Bildet er lagt til i galleriet.',
      });

    } catch (error: any) {
      console.error('Detaljert feil under opplasting:', error);
      let description = 'En ukjent feil oppstod. Se konsollen for detaljer.';
      if (error.code) {
        switch (error.code) {
          case 'storage/unauthorized':
            description = 'Du har ikke tilgang til å laste opp. Sjekk Storage-reglene i Firebase.';
            break;
          case 'storage/unknown':
            description = 'Ukjent Storage-feil. Dette skyldes ofte feil CORS-innstillinger for din Storage Bucket.';
            break;
          case 'permission-denied':
            description = 'Tilgang nektet til databasen. Sjekk Firestore-reglene.';
            break;
          case 'not-found':
             description = 'Dokumentet som skulle oppdateres ble ikke funnet i databasen. Dette skulle vært unngått med setDoc.';
             break;
          default:
            description = `En feil oppstod: ${error.code || error.message}`;
        }
      }
      
      toast({
        variant: 'destructive',
        title: 'Opplasting feilet',
        description: description,
      });
    } finally {
      setUploading(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!user) {
    return (
        <Button variant="secondary" disabled>
            Logg inn for å laste opp
        </Button>
    )
  }

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/gif, image/webp"
        disabled={uploading}
      />
      {uploading ? (
        <Button variant="secondary" disabled>
            <LoadingSpinner className="mr-2 h-4 w-4" />
            Laster opp...
        </Button>
      ) : (
        <Button variant="secondary" onClick={handleButtonClick}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Last opp bilde
        </Button>
      )}
    </div>
  );
}
