'use server';

import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import type { AppUser } from './types';
import { getAuth } from 'firebase-admin/auth';
import { initializeAdmin } from './firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// This function is now effectively a registration and organization creation function.
// It should be refactored or renamed in the future to reflect its new purpose.
export async function registerAndCreateOrg({ email, name, organizationName, uid }: { email: string, name: string, organizationName: string, uid: string}) {
    try {
        await initializeAdmin();
        const auth = getAuth();
        const adminDb = getFirestore();

        // Set custom claims on the user's auth token
        await auth.setCustomUserClaims(uid, { organizationId: uid, role: 'admin' });

        // Use a batch to perform atomic writes
        const batch = adminDb.batch();

        // Create the organization document
        const orgRef = adminDb.collection('organizations').doc(uid);
        batch.set(orgRef, {
            name: organizationName,
            ownerId: uid,
            createdAt: new Date(),
        });

        // Update the user document with organization details
        const userRef = adminDb.collection('users').doc(uid);
        batch.set(userRef, {
            uid: uid,
            displayName: name,
            email: email,
            role: 'admin',
            organizationId: uid,
            organizationName: organizationName,
        }, { merge: true }); // Use merge to avoid overwriting existing data if any

        await batch.commit();

        return { success: true };

    } catch (error: any) {
        console.error('Error in registerAndCreateOrg action:', error);
        return { success: false, error: 'En feil oppstod under opprettelse av organisasjon.' };
    }
}


export async function updateUserRole(uid: string, role: AppUser['role']) {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
    // Also update custom claims for role-based access control
    await initializeAdmin();
    const auth = getAuth();
    const user = await auth.getUser(uid);
    const currentClaims = user.customClaims || {};
    await auth.setCustomUserClaims(uid, { ...currentClaims, role });

    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: 'Could not update user role.' };
  }
}

interface InviteUserParams {
    email: string;
    role: AppUser['role'];
    organizationId: string;
    organizationName: string;
}

export async function inviteUser({ email, role, organizationId, organizationName }: InviteUserParams) {
    try {
        await initializeAdmin();
        const auth = getAuth();
        const adminDb = getFirestore();

        const userRecord = await auth.createUser({ email });
        
        await auth.setCustomUserClaims(userRecord.uid, { organizationId, organizationName, role: role || 'sjåfør' });

        const userDocRef = adminDb.collection('users').doc(userRecord.uid);
        await userDocRef.set({
            uid: userRecord.uid,
            email: email,
            displayName: email.split('@')[0],
            role: role || 'sjåfør',
            organizationId: organizationId,
            organizationName: organizationName,
        });
        
        const link = await auth.generatePasswordResetLink(email);
        console.log(`Password reset link for ${email}: ${link}`);

        return { success: true };

    } catch (error: any) {
        console.error('Error in inviteUser action:', error);
        if (error.code === 'auth/email-already-exists') {
            return { success: false, error: 'En bruker med denne e-posten er allerede registrert.' };
        }
        return { success: false, error: 'En ukjent feil oppstod ved invitasjon av bruker.' };
    }
}
