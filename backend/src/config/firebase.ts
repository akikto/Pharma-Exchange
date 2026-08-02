import admin from 'firebase-admin';
import { env, isFirebaseConfigured } from './env';
import { logger } from '../shared/utils/logger';

let firebaseApp: admin.app.App | null = null;

export function initializeFirebase(): admin.app.App | null {
  if (!isFirebaseConfigured()) {
    logger.warn('Firebase credentials not configured — auth/storage/FCM will use dev fallbacks');
    return null;
  }

  if (firebaseApp) return firebaseApp;

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID!,
      clientEmail: env.FIREBASE_CLIENT_EMAIL!,
      privateKey: env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
  });

  logger.info('Firebase Admin SDK initialized');
  return firebaseApp;
}

export function getFirebaseAuth(): admin.auth.Auth | null {
  const app = firebaseApp ?? initializeFirebase();
  return app ? admin.auth(app) : null;
}

export function getFirebaseStorage(): admin.storage.Storage | null {
  const app = firebaseApp ?? initializeFirebase();
  return app ? admin.storage(app) : null;
}

export function getFirebaseMessaging(): admin.messaging.Messaging | null {
  const app = firebaseApp ?? initializeFirebase();
  return app ? admin.messaging(app) : null;
}

export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return auth.verifyIdToken(idToken);
}
