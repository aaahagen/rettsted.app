'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, arrayUnion, serverTimestamp, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/hooks/use-auth';
import { UploadCloud } from 'lucide-react';
import LoadingSpinner from '../ui/loading-spinner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

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
    
    if (!file || !user || !locationId) {
      return;
    }

    setUploading(true);

    try {
      const fileId = uuidv4();
      const fileExtension = file.name.split('.').pop();
      const storagePath = `locations/${locationId}/${fileId}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      
      const downloadURL = await getDownloadURL(storageRef);

      const locationRef = doc(db, 'locations', locationId);
      const newImage = {
        id: fileId,
        url: downloadURL,
        caption: '', 
        uploadedBy: user.uid,
        uploadedAt: Timestamp.now(),
      };

      await setDoc(locationRef, {
        images: arrayUnion(newImage),
        lastUpdatedAt: serverTimestamp(),
        lastUpdatedBy: {
          uid: user.uid,
          name: user.displayName || 'Ukjent Bruker',
        }
      }, { merge: true });

      toast({
        title: 'Bilde lastet opp!',
        description: 'Bildet er lagt til i galleriet.',
      });

    } catch (error: any) {
      console.error('Detailed error during upload:', error);
      let description = 'En ukjent feil oppstod. Se konsollen for detaljer.';
      if (error.code) {
        switch (error.code) {
          case 'storage/unauthorized':
            description = 'Du har ikke tilgang til å laste opp. Sjekk Storage-reglene.';
            break;
          case 'storage/object-not-found':
             description = 'Filen ble ikke funnet etter opplasting. Sjekk Storage-reglene.';
            break;
          case 'storage/unknown':
            description = 'Ukjent Storage-feil. Dette skyldes ofte feil CORS-innstillinger.';
            break;
          case 'permission-denied':
            description = 'Tilgang nektet til databasen. Sjekk Firestore-reglene.';
            break;
          default:
            description = `Feilkode: ${error.code}. Melding: ${error.message}`;
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
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <UploadCloud className="mr-2 h-4 w-4" />
          Last opp bilde
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Last opp et nytt bilde</DialogTitle>
          <DialogDescription>
            Velg et bilde fra enheten din for å legge det til i galleriet for dette leveringsstedet.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/gif, image/webp"
            disabled={uploading}
          />
          {uploading ? (
            <Button variant="secondary" disabled className="w-full">
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Laster opp...
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleButtonClick} className="w-full">
              <UploadCloud className="mr-2 h-4 w-4" />
              Velg bilde
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
