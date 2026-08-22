function normalizeEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed || undefined;
}

function readFirebaseEnv(name: string): string | undefined {
  return normalizeEnvValue(process.env[name]);
}

export function getFirebaseProjectId(): string | undefined {
  return readFirebaseEnv('FIREBASE_PROJECT_ID');
}

export function getFirebaseClientEmail(): string | undefined {
  return readFirebaseEnv('FIREBASE_CLIENT_EMAIL');
}

export function getFirebasePrivateKey(): string | undefined {
  return readFirebaseEnv('FIREBASE_PRIVATE_KEY');
}

export function getFirebaseStorageBucket(): string | undefined {
  let bucket = readFirebaseEnv('FIREBASE_STORAGE_BUCKET');
  if (!bucket) return undefined;
  if (bucket.startsWith('gs://')) {
    bucket = bucket.slice('gs://'.length);
  }
  return bucket || undefined;
}

export function formatFirebasePrivateKeyForSdk(privateKey: string): string {
  return privateKey.replace(/\\n/g, '\n');
}

export function firebasePrivateKeyLooksValid(privateKey: string | undefined): boolean {
  if (!privateKey) return false;
  const normalized = formatFirebasePrivateKeyForSdk(privateKey);
  return normalized.includes('BEGIN PRIVATE KEY') && normalized.includes('END PRIVATE KEY');
}

export type FirebaseStorageDiagnostics = {
  firebaseProjectConfigured: boolean;
  firebaseClientConfigured: boolean;
  firebasePrivateKeyConfigured: boolean;
  firebasePrivateKeyLooksValid: boolean;
  firebaseStorageBucketConfigured: boolean;
  firebaseStorageConfigured: boolean;
};

export function getFirebaseStorageDiagnostics(): FirebaseStorageDiagnostics {
  const projectId = getFirebaseProjectId();
  const clientEmail = getFirebaseClientEmail();
  const privateKey = getFirebasePrivateKey();
  const storageBucket = getFirebaseStorageBucket();

  const firebaseProjectConfigured = Boolean(projectId);
  const firebaseClientConfigured = Boolean(clientEmail);
  const firebasePrivateKeyConfigured = Boolean(privateKey);
  const firebasePrivateKeyLooksValid = firebasePrivateKeyLooksValid(privateKey);
  const firebaseStorageBucketConfigured = Boolean(storageBucket);

  return {
    firebaseProjectConfigured,
    firebaseClientConfigured,
    firebasePrivateKeyConfigured,
    firebasePrivateKeyLooksValid,
    firebaseStorageBucketConfigured,
    firebaseStorageConfigured: Boolean(
      firebaseProjectConfigured &&
        firebaseClientConfigured &&
        firebasePrivateKeyConfigured &&
        firebasePrivateKeyLooksValid &&
        firebaseStorageBucketConfigured,
    ),
  };
}

export function listMissingFirebaseStorageConfig(): string[] {
  const diagnostics = getFirebaseStorageDiagnostics();
  const missing: string[] = [];
  if (!diagnostics.firebaseProjectConfigured) missing.push('FIREBASE_PROJECT_ID');
  if (!diagnostics.firebaseClientConfigured) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!diagnostics.firebasePrivateKeyConfigured) missing.push('FIREBASE_PRIVATE_KEY');
  else if (!diagnostics.firebasePrivateKeyLooksValid) {
    missing.push('FIREBASE_PRIVATE_KEY (invalid PEM format)');
  }
  if (!diagnostics.firebaseStorageBucketConfigured) missing.push('FIREBASE_STORAGE_BUCKET');
  return missing;
}
