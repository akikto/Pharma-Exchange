import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  getFirebaseStorageBucket,
  getFirebaseStorageDiagnostics,
  firebasePrivateKeyLooksValid,
} from '../src/config/firebase-env';

describe('firebase-env', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('strips gs:// prefix and surrounding quotes from bucket name', () => {
    vi.stubEnv('FIREBASE_STORAGE_BUCKET', '"gs://demo.appspot.com"');
    expect(getFirebaseStorageBucket()).toBe('demo.appspot.com');
  });

  it('reports storage configured only when all firebase vars are present and key looks valid', () => {
    vi.stubEnv('FIREBASE_PROJECT_ID', 'demo');
    vi.stubEnv('FIREBASE_CLIENT_EMAIL', 'svc@demo.iam.gserviceaccount.com');
    vi.stubEnv(
      'FIREBASE_PRIVATE_KEY',
      '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----',
    );
    vi.stubEnv('FIREBASE_STORAGE_BUCKET', 'demo.appspot.com');

    const diagnostics = getFirebaseStorageDiagnostics();
    expect(diagnostics.firebaseStorageConfigured).toBe(true);
    expect(firebasePrivateKeyLooksValid(process.env.FIREBASE_PRIVATE_KEY)).toBe(true);
  });

  it('flags missing storage bucket', () => {
    vi.stubEnv('FIREBASE_PROJECT_ID', 'demo');
    vi.stubEnv('FIREBASE_CLIENT_EMAIL', 'svc@demo.iam.gserviceaccount.com');
    vi.stubEnv(
      'FIREBASE_PRIVATE_KEY',
      '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----',
    );

    const diagnostics = getFirebaseStorageDiagnostics();
    expect(diagnostics.firebaseStorageBucketConfigured).toBe(false);
    expect(diagnostics.firebaseStorageConfigured).toBe(false);
  });
});
