import type { Timestamp } from 'firebase/firestore';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'driver' | 'admin';
}

export interface ImageAsset {
  id: string;
  url: string;
  caption: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
}

export interface DeliveryLocation {
  id: string;
  name: string;
  address: string;
  accessNotes: string;
  parkingNotes: string;
  receivingNotes: string;
  openingHours: string;
  specialConsiderations: string;
  images?: ImageAsset[];
  lastUpdatedBy?: {
    uid: string;
    name: string;
  };
  lastUpdatedAt?: Timestamp;
  createdBy: {
    uid: string;
    name: string;
  };
  createdAt: Timestamp;
}
