import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Only initialize if we haven't already and if we have the credentials
const initFirebaseAdmin = () => {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
    console.warn('Firebase Admin: Missing FIREBASE_PROJECT_ID or FIREBASE_PRIVATE_KEY in environment variables.');
    return;
  }
  if (!getApps().length) {
    try {
      // In production, you'd use a service account key
      // For development/Vercel, we can pass the params directly
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle multiline private keys from env vars
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
      console.error('Firebase Admin initialization error', error);
    }
  }
};

export const getAdminDb = () => {
    initFirebaseAdmin();
    return getFirestore();
};

export const getAdminAuth = () => {
    initFirebaseAdmin();
    return getAuth();
};
