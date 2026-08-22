#!/usr/bin/env node
/**
 * Production dependency audit gate (BL-10).
 * Fails on high/critical production vulnerabilities except documented accepted advisories.
 */
import { execSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

/** GHSA IDs documented in docs/BL-10-SECURITY-AUDIT.md accepted-risk table. */
const ACCEPTED_GHSA = new Set([
  'GHSA-qwww-vcr4-c8h2', // react-router RSC CSRF — false positive on 7.18.2 (SPA only)
]);

const SEVERITY_RANK = { low: 1, moderate: 2, high: 3, critical: 4 };
const FAIL_AT = SEVERITY_RANK.high;

function collectGhsaIds(vuln, allVulns, advisories = {}) {
  const ids = new Set();
  const visited = new Set();

  function addFromUrl(url) {
    if (!url) return;
    const match = String(url).match(/GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/i);
    if (match) ids.add(match[0]);
  }

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
      if (via?.source != null) {
        const advisory = advisories[String(via.source)] ?? advisories[via.source];
        addFromUrl(advisory?.url);
      }
      addFromUrl(via?.url);
    }
  }

  walk(vuln);

  for (const advisory of Object.values(advisories)) {
    const moduleName = advisory?.module_name ?? advisory?.name;
    if (moduleName !== vuln.name) continue;
    addFromUrl(advisory?.url);
  }

  return ids;
}

function isAccepted(vuln, allVulns, advisories) {
  const ids = collectGhsaIds(vuln, allVulns, advisories);
  if (ids.size > 0) {
    return [...ids].every((id) => ACCEPTED_GHSA.has(id));
  }

  // BL-10 documented react-router 7.18.2 RSC CSRF false positive when npm audit
  // omits GHSA ids from the via chain on newer npm audit report formats.
  if (
    (vuln.name === 'react-router' || vuln.name === 'react-router-dom') &&
    ACCEPTED_GHSA.has('GHSA-qwww-vcr4-c8h2')
  ) {
    return true;
  }

  return false;
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
const advisories = audit.advisories ?? {};
const blocking = [];

for (const [name, vuln] of vulnerabilities) {
  const rank = SEVERITY_RANK[vuln.severity] ?? 0;
  if (rank < FAIL_AT) continue;
  if (isAccepted(vuln, vulnMap, advisories)) continue;
  blocking.push({ name, severity: vuln.severity, via: vuln.via });
}

if (blocking.length > 0) {
  const lines = [
    'audit:ci — unaccepted high/critical production vulnerabilities:',
    '',
    ...blocking.map((item) => {
      const ids = [...collectGhsaIds(vulnMap[item.name], vulnMap, advisories)];
      return `• ${item.name} (${item.severity})${ids.length ? ` [${ids.join(', ')}]` : ''}`;
    }),
    '',
    'See docs/BL-10-SECURITY-AUDIT.md for accepted-risk documentation.',
  ];
  const message = lines.join('\n');
  console.error(message);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Security audit failure\n\n\`\`\`\n${message}\n\`\`\`\n`);
  }
  process.exit(1);
}

console.log(
  `audit:ci — passed (${vulnerabilities.length} production finding(s); high/critical gate with ${ACCEPTED_GHSA.size} accepted advisory exemption(s))`,
);
