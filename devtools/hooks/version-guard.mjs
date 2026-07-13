#!/usr/bin/env node
// Pre-commit version guard (invoked by devtools/hooks/pre-commit). Warns when a plugin should bump its
// `version` but didn't, in TWO cases:
//   1. staged changes touch that plugin's own project dir, OR
//   2. staged changes touch the SHARED SDK reference (`lib/*.dll` — the Core/Plugin.Sdk contract EVERY
//      pack binds to; re-vendored via `plugin-sdk`) — which invalidates every built pack (they must
//      REBUILD against the new contract), so each plugin should bump too.
// Non-blocking (always exits 0) — the dev may have a reason not to; semver level is a human call. The
// REPO releaseVersion is a separate tier (bumped by the release workflow).
import { execFileSync } from 'node:child_process';

const git = (...a) => { try { return execFileSync('git', a, { encoding: 'utf8' }); } catch { return ''; } };
const parse = (s) => { try { return JSON.parse(s); } catch { return null; } };

const staged = git('diff', '--cached', '--name-only').split(/\r?\n/).filter(Boolean).map((f) => f.replace(/\\/g, '/'));
if (!staged.length) process.exit(0);

const stagedMan = parse(git('show', ':plugins.manifest.json'));   // what's about to be committed
const headMan = parse(git('show', 'HEAD:plugins.manifest.json')); // last commit (null on first commit)
if (!stagedMan?.plugins) process.exit(0);

const verOf = (man, id) => man?.plugins?.find((p) => p.id === id)?.version;

// A staged change under lib/ is a SHARED reference change → affects every pack.
const libChanged = staged.some((f) => f.startsWith('lib/'));

const warnings = [];
for (const p of stagedMan.plugins) {
  const dir = p.project.replace(/\\/g, '/').split('/').slice(0, -1).join('/'); // plugin project folder
  const touched = staged.some((f) => f.startsWith(dir + '/'));
  const bumped = headMan ? verOf(stagedMan, p.id) !== verOf(headMan, p.id) : true; // first commit = ok
  if (bumped) continue;
  if (touched) warnings.push(`  • ${p.id} (v${p.version}) — ${dir}/ changed but version not bumped`);
  else if (libChanged) warnings.push(`  • ${p.id} (v${p.version}) — lib/ SDK contract changed but version not bumped → the pack must rebuild against it`);
}

if (warnings.length) {
  console.warn('\x1b[33m[version-guard] plugin needs a version bump (a changed pack rebuilds; unchanged carries forward):\x1b[0m');
  console.warn(warnings.join('\n'));
  console.warn('  → node devtools/dev.mjs bump <id> [major|minor]   (intentional? this is only a warning — commit proceeds)');
}
process.exit(0); // WARN only — NEVER block a commit
