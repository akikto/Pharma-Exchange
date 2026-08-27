#!/usr/bin/env node
/**
 * Validates twa/twa-manifest.json for required Play/TWA fields.
 * No network access required.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(__dirname, '..', 'twa-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const required = [
  'packageId',
  'host',
  'name',
  'launcherName',
  'startUrl',
  'webManifestUrl',
  'appVersionCode',
  'appVersionName',
  'targetSdkVersion',
];

const errors = [];
for (const key of required) {
  if (manifest[key] === undefined || manifest[key] === '') {
    errors.push(`Missing required field: ${key}`);
  }
}

const prodHost = 'pharma-exchange-frontend.vercel.app';
if (manifest.host !== prodHost) {
  errors.push(`host must be ${prodHost} (got ${manifest.host})`);
}
if (manifest.packageId !== 'com.pharmex.exchange') {
  errors.push(`packageId must be com.pharmex.exchange (got ${manifest.packageId})`);
}
if (String(manifest.webManifestUrl).includes('localhost')) {
  errors.push('webManifestUrl must not reference localhost');
}
if (Number(manifest.targetSdkVersion) < 34) {
  errors.push('targetSdkVersion should be >= 34 for current Play requirements');
}

if (errors.length) {
  console.error('twa-manifest.json validation failed:');
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}

console.log('twa-manifest.json OK');
