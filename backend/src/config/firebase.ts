import admin from 'firebase-admin';
import { env, isFirebaseConfigured } from './env';
import {
  formatFirebasePrivateKeyForSdk,
  getFirebaseClientEmail,
  getFirebasePrivateKey,
  getFirebaseProjectId,
  getFirebaseStorageBucket,
} from './firebase-env';
import { logger } from '../shared/utils/logger';

let firebaseApp: admin.app.App | null = null;

export function initializeFirebase(): admin.app.App | null {
  if (!isFirebaseConfigured()) {
    logger.warn('Firebase credentials not configured — auth/storage/FCM will use dev fallbacks');
    return null;
  }

  if (firebaseApp) return firebaseApp;

  const projectId = getFirebaseProjectId();
  const clientEmail = getFirebaseClientEmail();
  const privateKey = getFirebasePrivateKey();
  const storageBucket = getFirebaseStorageBucket();

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn('Firebase credentials incomplete — auth/storage/FCM will use dev fallbacks');
    return null;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: formatFirebasePrivateKeyForSdk(privateKey),
    }),
    storageBucket,
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
  const checkRevoked = env.NODE_ENV === 'production';
  return auth.verifyIdToken(idToken, checkRevoked);
}
