'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdmin } from './firebase-admin';

interface RegisterParams {
    uid: string;
    email: string;
    name: string;
    organizationName: string;
}

export async function registerAndCreateOrg({ uid, email, name, organizationName }: RegisterParams) {
    try {
        await initializeAdmin();
        const auth = getAuth();
        const adminDb = getFirestore();

        // **This is the critical step**: Set a custom claim on the user's auth token.
        // This claim will be used in Firestore security rules to grant access.
        // We use the user's UID as the organization ID for simplicity.
        await auth.setCustomUserClaims(uid, { organizationId: uid, role: 'admin' });

        // Use a batch for atomic writes to Firestore.
        const batch = adminDb.batch();

        // 1. Create the organization document.
        const orgRef = adminDb.collection('organizations').doc(uid);
        batch.set(orgRef, {
            name: organizationName,
            ownerId: uid,
            createdAt: new Date(),
        });

        // 2. Create the user document and link it to the new organization.
        const userRef = adminDb.collection('users').doc(uid);
        batch.set(userRef, {
            uid: uid,
            displayName: name,
            email: email,
            role: 'admin',
            organizationId: uid, // Link to the organization
            organizationName: organizationName,
        });

        // Commit all writes to the database at once.
        await batch.commit();

        return { success: true };

    } catch (error: any) {
        console.error('Error in registerAndCreateOrg action:', error);
        // Provide a more generic error message to the client.
        return { success: false, error: 'En server-feil oppstod under opprettelse av organisasjon.' };
    }
}
