'use client';

import { ChangeEvent, useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, arrayUnion, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/hooks/use-auth';
import { UploadCloud } from 'lucide-react';
import LoadingSpinner from '../ui/loading-spinner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';

interface ImageUploaderProps {
  locationId: string;
}

export default function ImageUploader({ locationId }: ImageUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Handle preview URL generation and cleanup
  useEffect(() => {
    if (!fileToUpload) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(fileToUpload);
    setPreviewUrl(objectUrl);

    // Clean up memory when component unmounts or file changes
    return () => URL.revokeObjectURL(objectUrl);
  }, [fileToUpload]);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Validate that it's actually an image
    if (!file.type.startsWith('image/')) {
        toast({
            variant: 'destructive',
            title: 'Ugyldig filtype',
            description: 'Vennligst velg en bildefil (jpg, png, etc.).',
        });
        return;
    }

    setFileToUpload(file);
    setOpen(true);
  };

  const handleUpload = async () => {
    if (!fileToUpload || !user || !locationId) {
      return;
    }

    setUploading(true);

    try {
      const fileId = uuidv4();
      const fileExtension = fileToUpload.name.split('.').pop();
      const storagePath = `locations/${locationId}/${fileId}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);

      // Perform the upload
      const snapshot = await uploadBytes(storageRef, fileToUpload);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update Firestore with the new image data
      const locationRef = doc(db, 'locations', locationId);
      const newImage = {
        id: fileId,
        url: downloadURL,
        caption: caption.trim(), 
        uploadedBy: user.uid,
        uploadedAt: Timestamp.now(),
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

      setOpen(false); // Close dialog on success

    } catch (error: any) {
      console.error('Detailed upload error:', error);
      let description = 'En uventet feil oppstod under opplasting.';
      
      if (error.code === 'storage/quota-exceeded') {
          description = 'Lagringsplassen er full. Oppgrader Firebase-planen din.';
      } else if (error.code === 'storage/unauthorized') {
          description = 'Du har ikke tilgang til å laste opp bilder her.';
      }

      toast({
        variant: 'destructive',
        title: 'Opplasting feilet',
        description: description,
      });
    } finally {
      setUploading(false);
      setFileToUpload(null);
      setCaption('');
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
      if (!uploading) {
          setOpen(newOpen);
          if (!newOpen) {
              setFileToUpload(null);
              setCaption('');
          }
      }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Last opp bilde
        </Button>
      </DialogTrigger>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*"
      />

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Last opp bilde</DialogTitle>
          <DialogDescription>
            Legg til en beskrivelse av bildet før du lagrer det.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
            {previewUrl && (
                <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                    <img 
                        src={previewUrl} 
                        alt="Preview"
                        className="h-full w-full object-contain"
                    />
                </div>
            )}
            <Input 
                placeholder="Skriv en bildetekst (f.eks. 'Inngang fra bakgården')..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={uploading}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !uploading) handleUpload();
                }}
            />
        </div>

        <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={uploading}>
                Avbryt
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !fileToUpload}>
                {uploading ? (
                    <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Laster opp...
                    </>
                ) : 'Lagre bilde'}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
