#!/usr/bin/env node
/**
 * Sync production schema during Vercel builds.
 *
 * Strategy:
 * 1. Try `prisma migrate deploy`
 * 2. On P3005 (non-empty DB without migration history), baseline existing migrations
 *    with `prisma migrate resolve --applied` and retry deploy
 * 3. Finish with `prisma db push` to apply any remaining schema drift safely
 */
import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

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

function isP3005(output) {
  return output.includes('P3005') || output.includes('database schema is not empty');
}

function listMigrationNames() {
  const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function baselineExistingDatabase() {
  const migrations = listMigrationNames();
  if (migrations.length === 0) {
    console.warn('[vercel-schema-sync] No migrations found to baseline.');
    return;
  }

  console.warn(
    `[vercel-schema-sync] Baselining ${migrations.length} migration(s) with prisma migrate resolve...`,
  );

  for (const migration of migrations) {
    const result = runCapture(`npx prisma migrate resolve --applied "${migration}"`);
    if (result.ok) {
      console.log(`[vercel-schema-sync] Marked migration as applied: ${migration}`);
      continue;
    }

    if (
      result.output.includes('already been applied')
      || result.output.includes('already recorded')
      || result.output.includes('is already recorded as applied')
    ) {
      console.log(`[vercel-schema-sync] Migration already recorded: ${migration}`);
      continue;
    }

    console.warn(`[vercel-schema-sync] Could not baseline ${migration}:\n${result.output}`);
  }
}

if (!process.env.DATABASE_URL) {
  console.error(
    '[vercel-schema-sync] DATABASE_URL is not set. Add it to Vercel → Settings → Environment Variables for Production and Preview builds.',
  );
  process.exit(1);
}

console.log('[vercel-schema-sync] Applying database schema...');

let migrate = runCapture('npx prisma migrate deploy');

if (!migrate.ok && isP3005(migrate.output)) {
  baselineExistingDatabase();
  migrate = runCapture('npx prisma migrate deploy');
}

if (migrate.ok) {
  console.log('[vercel-schema-sync] Migrations applied successfully.');
} else if (!isP3005(migrate.output)) {
  console.error('[vercel-schema-sync] prisma migrate deploy failed:\n', migrate.output);
  process.exit(1);
} else {
  console.warn(
    '[vercel-schema-sync] Migrate deploy still unavailable after baseline. Continuing with prisma db push.',
  );
}

run('npx prisma db push --skip-generate', { inherit: true });
console.log('[vercel-schema-sync] Schema sync complete.');
