#!/usr/bin/env node
/**
 * Sync production schema during Vercel builds.
 *
 * Uses `prisma migrate deploy` when migration history exists.
 * Falls back to `prisma db push` for databases created via db push (P3005).
 */
import { execSync } from 'node:child_process';

function run(command, { inherit = false } = {}) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: inherit ? 'inherit' : 'pipe',
  });
}

function runCapture(command) {
  try {
    const stdout = run(command);
    if (stdout) process.stdout.write(stdout);
    return { ok: true, output: stdout ?? '' };
  } catch (error) {
    const output = [
      error.stdout,
      error.stderr,
      error.message,
    ].filter(Boolean).join('\n');
    return { ok: false, output };
  }
}

if (!process.env.DATABASE_URL) {
  console.error(
    '[vercel-schema-sync] DATABASE_URL is not set. Add it to Vercel → Settings → Environment Variables for Production and Preview builds.',
  );
  process.exit(1);
}

console.log('[vercel-schema-sync] Applying database schema...');

const migrate = runCapture('npx prisma migrate deploy');

if (migrate.ok) {
  console.log('[vercel-schema-sync] Migrations applied successfully.');
} else if (migrate.output.includes('P3005') || migrate.output.includes('database schema is not empty')) {
  console.warn(
    '[vercel-schema-sync] Database is not baselined for Prisma Migrate (P3005). Falling back to prisma db push.',
  );
} else {
  console.error('[vercel-schema-sync] prisma migrate deploy failed:\n', migrate.output);
  process.exit(1);
}

run('npx prisma db push --skip-generate', { inherit: true });
console.log('[vercel-schema-sync] Schema sync complete.');
