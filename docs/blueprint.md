# **App Name**: Routemate

## Core Features:

- User Authentication: Secure sign-in using email and password with role-based access control (driver/admin) using Firebase Authentication.
- Delivery Location Management: Create, view, edit, and manage delivery locations, each including name, address, access instructions, parking details, receiving information, opening hours, special considerations, and last updated timestamp, stored in Firestore.
- Image Capture and Upload: Capture images directly within the app or upload existing images, adding captions to each and associating them with specific delivery locations, all stored in Firebase Storage.
- Content Versioning: Allow drivers and admins to edit delivery information, with a clear display of the last modification date, stored in Firestore.
- Search and Navigation: Enable searching for delivery locations by name or address and provide a mobile-optimized list view with quick access to recent locations, stored in Firestore.
- Admin and Subscription Management: Enable admins to manage users, assign roles, and handle subscriptions using Stripe integration, and overseeing platform activities, all stored in Firestore.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) for reliability and professionalism.
- Background color: Light grey (#F0F2F5), providing a neutral backdrop.
- Accent color: Bright orange (#FF9800) to highlight key actions and interactive elements.
- Body and headline font: 'PT Sans' sans-serif, for a modern look and a little warmth or personality.
- Use clear, intuitive icons to represent delivery-related actions and information.
- Prioritize a mobile-first, clean layout, reducing 'app noise' for a seamless user experience.
- Employ subtle transitions and loading animations to enhance user engagement without distraction.