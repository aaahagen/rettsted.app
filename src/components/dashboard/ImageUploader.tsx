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
    
    if (!file || !user) {
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Ikke autentisert',
          description: 'Du må være logget inn for å laste opp bilder.',
        });
      }
      return;
    }

    setUploading(true);
    console.log("Uploading to locationId:", locationId);
    console.log("File to upload:", file);
    console.log("User UID:", user.uid);


    try {
      // 1. Create a unique reference in Firebase Storage
      const fileId = uuidv4();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${fileId}.${fileExtension}`;
      const storageRef = ref(storage, `locations/${locationId}/${fileName}`);

      // 2. Upload the file
      await uploadBytes(storageRef, file);

      // 3. Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Download URL:", downloadURL);

      // 4. Update the Firestore document using setDoc with merge: true
      const locationRef = doc(db, 'locations', locationId);
      const newImage = {
        id: fileId,
        url: downloadURL,
        caption: '', // Caption can be added later
        uploadedBy: user.uid,
        uploadedAt: serverTimestamp(),
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
      console.error('Detailed Upload Error:', error);
      let description = 'Kunne ikke laste opp bildet. Prøv igjen.';
      if (error.code) {
        switch (error.code) {
            case 'storage/unauthorized':
                description = 'Du har ikke tilgang til å laste opp. Sjekk Storage-reglene i Firebase.';
                break;
            case 'storage/object-not-found':
                 description = 'Filen ble ikke funnet. Dette kan skje hvis opplastingen ble avbrutt.';
                break;
            case 'storage/unknown':
                description = 'En ukjent feil oppstod med Storage. Dette kan skyldes CORS-innstillinger. Se konsollen.';
                break;
            case 'permission-denied':
                description = 'Tilgang nektet til databasen. Sjekk Firestore-reglene.';
                break;
            case 'not-found':
                 description = 'Dokumentet som skulle oppdateres ble ikke funnet i databasen.';
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
      // Reset file input
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
        accept="image/png, image/jpeg, image/gif"
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
