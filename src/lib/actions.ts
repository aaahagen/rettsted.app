'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

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
  user: any, // user type can be more specific
  locationId?: string
) {
  // This function is deprecated for client-side use. 
  // Firestore writes should be done directly on the client to ensure auth context.
  console.error("createOrUpdateLocation Server Action should not be used from the client.");
  throw new Error("This Server Action is deprecated. Perform Firestore writes on the client.");
}

export async function updateUserRole(uid: string, role: 'admin' | 'driver') {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
  } catch (error) {
    console.error('Error updating user role:', error);
    // It's better to throw the original error or a more specific one
    throw new Error('Could not update user role.');
  }
}
