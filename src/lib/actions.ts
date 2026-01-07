'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdmin } from './firebase-admin';

// --- Types ---
type AppRole = 'admin' | 'driver';

interface RegisterParams {
    uid: string;
    email: string;
    name: string;
    organizationName: string;
}

interface InviteParams {
    email: string;
    role: AppRole;
    organizationId: string;
    organizationName: string;
}

// --- Actions ---

/**
 * Registers a new user and creates their organization.
 * Used when a new company signs up.
 */
export async function registerAndCreateOrg({ uid, email, name, organizationName }: RegisterParams) {
    try {
        await initializeAdmin();
        const auth = getAuth();
        const adminDb = getFirestore();

        await auth.setCustomUserClaims(uid, { organizationId: uid, role: 'admin' });

        const batch = adminDb.batch();

        const orgRef = adminDb.collection('organizations').doc(uid);
        batch.set(orgRef, {
            name: organizationName,
            ownerId: uid,
            createdAt: new Date(),
        });

        const userRef = adminDb.collection('users').doc(uid);
        batch.set(userRef, {
            uid: uid,
            displayName: name,
            email: email,
            role: 'admin',
            organizationId: uid,
            organizationName: organizationName,
        });

        await batch.commit();
        return { success: true };

    } catch (error: any) {
        console.error('Error in registerAndCreateOrg:', error);
        return { success: false, error: 'Kunne ikke opprette organisasjon.' };
    }
}

/**
 * Invites a new user to an existing organization.
 */
export async function inviteUser({ email, role, organizationId, organizationName }: InviteParams) {
    try {
        await initializeAdmin();
        const auth = getAuth();
        const adminDb = getFirestore();

        // 1. Create the user in Firebase Auth (without a password)
        const userRecord = await auth.createUser({
            email,
            emailVerified: false,
        });

        // 2. Set custom claims for the new user
        await auth.setCustomUserClaims(userRecord.uid, { 
            organizationId, 
            role,
            organizationName
        });

        // 3. Create the user profile document in Firestore
        await adminDb.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: email,
            displayName: email.split('@')[0], // Default display name
            role: role,
            organizationId: organizationId,
            organizationName: organizationName,
            createdAt: new Date(),
        });

        // 4. Generate a password reset link
        const resetLink = await auth.generatePasswordResetLink(email);
        
        console.log(`INVITATION CREATED for ${email}. Link: ${resetLink}`);

        return { 
            success: true, 
            resetLink // Return the link so it can be shown/sent in the UI for now
        };

    } catch (error: any) {
        console.error('Error in inviteUser:', error);
        if (error.code === 'auth/email-already-exists') {
            return { success: false, error: 'En bruker med denne e-posten eksisterer allerede.' };
        }
        return { success: false, error: 'Kunne ikke invitere bruker.' };
    }
}

/**
 * Updates a user's role within the organization.
 */
export async function updateUserRole(uid: string, role: AppRole) {
    try {
        await initializeAdmin();
        const auth = getAuth();
        const adminDb = getFirestore();

        // 1. Update the document in Firestore
        await adminDb.collection('users').doc(uid).update({ role });

        // 2. Update the custom claims for immediate permission update
        const user = await auth.getUser(uid);
        const currentClaims = user.customClaims || {};
        await auth.setCustomUserClaims(uid, { ...currentClaims, role });

        return { success: true };
    } catch (error) {
        console.error('Error in updateUserRole:', error);
        return { success: false, error: 'Kunne ikke oppdatere rolle.' };
    }
}
