'use server';

import { doc, setDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { AppUser } from './types';

interface LocationFormData {
    name: string;
    address: string;
    openingHours?: string;
    accessNotes?: string;
    parkingNotes?: string;
    receivingNotes?: string;
    specialConsiderations?: string;
}

export async function createOrUpdateLocation(
  data: LocationFormData,
  user: AppUser,
  locationId?: string
) {
  try {
    const locationData = {
      ...data,
      lastUpdatedBy: {
        uid: user.uid,
        name: user.displayName || 'Ukjent bruker',
      },
      lastUpdatedAt: serverTimestamp(),
    };

    if (locationId) {
      // Update existing location
      const locationRef = doc(db, 'locations', locationId);
      await updateDoc(locationRef, locationData);
      return { id: locationId };
    } else {
      // Create new location
      const newLocationRef = doc(collection(db, 'locations'));
      await setDoc(newLocationRef, {
        ...locationData,
        images: [],
        createdBy: {
          uid: user.uid,
          name: user.displayName || 'Ukjent bruker',
        },
        createdAt: serverTimestamp(),
      });
      return { id: newLocationRef.id };
    }
  } catch (error) {
    console.error('Error creating/updating location:', error);
    throw new Error('Could not save location to the database.');
  }
}
