
'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/hooks/use-auth';
import { UploadCloud } from 'lucide-react';
import LoadingSpinner from '../ui/loading-spinner';
import { Progress } from '../ui/progress';

interface ImageUploaderProps {
  locationId: string;
}

export default function ImageUploader({ locationId }: ImageUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

    setUploading(true);
    setUploadProgress(0);

    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${fileId}.${fileExtension}`;
    const storageRef = ref(storage, `locations/${locationId}/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        setUploading(false);
        let description = 'Kunne ikke laste opp bildet. Prøv igjen.';
        if (error.code === 'storage/unauthorized') {
            description = 'Du har ikke tilgang til å laste opp. Sjekk Storage-reglene i Firebase.';
        } else if (error.code === 'storage/unknown') {
            description = 'En ukjent feil oppstod. Dette kan skyldes CORS-innstillinger. Se konsollen for detaljer.';
        }
        toast({
          variant: 'destructive',
          title: 'Opplasting feilet',
          description: description,
        });
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const locationRef = doc(db, 'locations', locationId);
          
          const newImage = {
            id: fileId,
            url: downloadURL,
            caption: '', // Caption can be added later
            uploadedBy: user.uid,
            uploadedAt: serverTimestamp(),
          };

          await updateDoc(locationRef, {
            images: arrayUnion(newImage),
            lastUpdatedAt: serverTimestamp(),
            lastUpdatedBy: {
              uid: user.uid,
              name: user.displayName || 'Ukjent Bruker',
            }
          });

          toast({
            title: 'Bilde lastet opp!',
            description: 'Bildet er lagt til i galleriet.',
          });
        } catch (error) {
          console.error('Firestore update error:', error);
          toast({
            variant: 'destructive',
            title: 'Databasefeil',
            description: 'Kunne ikke lagre bildeinformasjonen.',
          });
        } finally {
          setUploading(false);
          setUploadProgress(0);
        }
      }
    );
  };

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
        <div className="flex flex-col items-center gap-2 w-40">
            <div className="flex items-center justify-center gap-2">
                <LoadingSpinner className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">Laster opp... {Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full h-2" />
        </div>
      ) : (
        <Button variant="secondary" onClick={handleButtonClick}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Last opp bilde
        </Button>
      )}
    </div>
  );
}
