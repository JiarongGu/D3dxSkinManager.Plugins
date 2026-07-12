#!/usr/bin/env node
// Pre-commit version guard (invoked by devtools/hooks/pre-commit). For each plugin, if staged changes
// touch its project dir but its manifest `version` is UNCHANGED vs HEAD, print a WARNING. Non-blocking
// (always exits 0) — a per-plugin change should bump that plugin's version, but the dev may have a
// reason not to. The REPO releaseVersion is a separate tier (bumped by the release workflow).
import { execFileSync } from 'node:child_process';

const git = (...a) => { try { return execFileSync('git', a, { encoding: 'utf8' }); } catch { return ''; } };
const parse = (s) => { try { return JSON.parse(s); } catch { return null; } };

const staged = git('diff', '--cached', '--name-only').split(/\r?\n/).filter(Boolean).map((f) => f.replace(/\\/g, '/'));
if (!staged.length) process.exit(0);

const stagedMan = parse(git('show', ':plugins.manifest.json'));   // what's about to be committed
const headMan = parse(git('show', 'HEAD:plugins.manifest.json')); // last commit (null on first commit)
if (!stagedMan?.plugins) process.exit(0);

const verOf = (man, id) => man?.plugins?.find((p) => p.id === id)?.version;

const warnings = [];
for (const p of stagedMan.plugins) {
  const dir = p.project.replace(/\\/g, '/').split('/').slice(0, -1).join('/'); // plugin project folder
  const touched = staged.some((f) => f.startsWith(dir + '/'));
  const bumped = headMan ? verOf(stagedMan, p.id) !== verOf(headMan, p.id) : true; // first commit = ok
  if (touched && !bumped) warnings.push(`  • ${p.id} (v${p.version}) — ${dir}/ changed but version not bumped`);
}

if (warnings.length) {
  console.warn('\x1b[33m[version-guard] plugin changed without a version bump:\x1b[0m');
  console.warn(warnings.join('\n'));
  console.warn('  → node devtools/dev.mjs bump <id> [major|minor]   (intentional? this is only a warning — commit proceeds)');
}
process.exit(0); // WARN only — NEVER block a commit
