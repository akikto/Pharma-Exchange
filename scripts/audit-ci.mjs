#!/usr/bin/env node
/**
 * Production dependency audit gate (BL-10).
 * Fails on high/critical production vulnerabilities except documented accepted advisories.
 */
import { execSync } from 'node:child_process';

/** GHSA IDs documented in docs/BL-10-SECURITY-AUDIT.md accepted-risk table. */
const ACCEPTED_GHSA = new Set([
  'GHSA-qwww-vcr4-c8h2', // react-router RSC CSRF — false positive on 7.18.2 (SPA only)
]);

const SEVERITY_RANK = { low: 1, moderate: 2, high: 3, critical: 4 };
const FAIL_AT = SEVERITY_RANK.high;

function collectGhsaIds(vuln, allVulns) {
  const ids = new Set();
  const visited = new Set();

  function walk(entry) {
    if (!entry || visited.has(entry.name)) return;
    visited.add(entry.name);

    for (const via of entry.via ?? []) {
      if (typeof via === 'string') {
        const related = allVulns[via];
        if (related) {
          walk(related);
        }
        continue;
      }
      if (via?.url) {
        const match = String(via.url).match(/GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/i);
        if (match) ids.add(match[0]);
      }
    }
  }

  walk(vuln);
  return ids;
}

function isAccepted(vuln, allVulns) {
  const ids = collectGhsaIds(vuln, allVulns);
  if (ids.size === 0) return false;
  return [...ids].every((id) => ACCEPTED_GHSA.has(id));
}

let audit;
try {
  const raw = execSync('npm audit --omit=dev --json', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  audit = JSON.parse(raw);
} catch (err) {
  const stdout = err.stdout?.toString?.() ?? '';
  try {
    audit = JSON.parse(stdout);
  } catch {
    console.error('audit:ci — failed to parse npm audit output');
    console.error(stdout || err.message);
    process.exit(1);
  }
}

const vulnerabilities = Object.entries(audit.vulnerabilities ?? {});
const vulnMap = Object.fromEntries(vulnerabilities);
const blocking = [];

for (const [name, vuln] of vulnerabilities) {
  const rank = SEVERITY_RANK[vuln.severity] ?? 0;
  if (rank < FAIL_AT) continue;
  if (isAccepted(vuln, vulnMap)) continue;
  blocking.push({ name, severity: vuln.severity, via: vuln.via });
}

if (blocking.length > 0) {
  console.error('audit:ci — unaccepted high/critical production vulnerabilities:\n');
  for (const item of blocking) {
    const ids = [...collectGhsaIds(vulnMap[item.name], vulnMap)];
    console.error(`  • ${item.name} (${item.severity})${ids.length ? ` [${ids.join(', ')}]` : ''}`);
  }
  console.error('\nSee docs/BL-10-SECURITY-AUDIT.md for accepted-risk documentation.');
  process.exit(1);
}

console.log(
  `audit:ci — passed (${vulnerabilities.length} production finding(s); high/critical gate with ${ACCEPTED_GHSA.size} accepted advisory exemption(s))`,
);
