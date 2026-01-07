import admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK.
// It checks if the SDK has already been initialized to prevent errors.
// In a serverless environment (like Vercel or Firebase Functions), this ensures
// that we reuse the existing admin app instance across function invocations.

export function initializeAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // When deployed to a Google Cloud environment (like Firebase Hosting with server-side rendering,
  // or Cloud Functions), the Admin SDK can automatically discover the service account credentials.
  // Therefore, we don't need to pass a credential object to initializeApp().
  admin.initializeApp();
  
  return admin.app();
}
