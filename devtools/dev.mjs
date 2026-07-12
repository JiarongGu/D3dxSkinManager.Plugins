#!/usr/bin/env node
// dev.mjs — the plugin repo dev loop. Manifest-driven, mirrors the release workflow locally.
//
//   node devtools/dev.mjs <command>
//     build                     build every pack in plugins.manifest.json (Release)
//     pack [id]                 build + zip pack dll(s) into dist/<asset> (release format); all packs if no id
//     install [id] [pluginsDir] build + drop the SINGLE self-contained dll into <pluginsDir>/<id>/ for a
//                               LIVE app test (mirrors {profile}/plugins/{packId}/); no dir → dist/install/
//     sdk                       print how to refresh the vendored SDK dlls (run in the MAIN app repo)
//
// Zero-dep (Node 24 globals). The SDK dlls live in lib/ (tracked), published from the app via its own
// `node devtools/dev.mjs plugin-sdk`. Reference them with Private=false — never ship Core/Sdk in a pack.

import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync, existsSync, rmSync, copyFileSync, statSync } from 'node:fs';
import { resolve, join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'plugins.manifest.json'), 'utf8'));
const [cmd, arg] = process.argv.slice(2);

function build(p) {
  console.log(`[dev] build ${p.id} v${p.version}`);
  const r = spawnSync('dotnet', ['build', p.project, '-c', 'Release', '--nologo', '-clp:ErrorsOnly'], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}

function requireModel(p) {
  if (p.model && !existsSync(join(root, p.model.dest)))
    console.warn(`[dev] WARNING: ${p.model.dest} missing — CI fetches it from ${p.model.url}; build will fail without it locally.`);
}

if (cmd === 'build') {
  for (const p of manifest.plugins) { requireModel(p); build(p); }
} else if (cmd === 'pack') {
  const packs = arg ? manifest.plugins.filter((p) => p.id === arg) : manifest.plugins;
  if (!packs.length) { console.error(`[dev] no pack with id "${arg}"`); process.exit(2); }
  const dist = join(root, 'dist');
  mkdirSync(dist, { recursive: true });
  for (const p of packs) {
    requireModel(p); build(p);
    const zip = join(dist, p.asset);
    if (existsSync(zip)) rmSync(zip);
    // Single-dll pack: zip just the built dll (Compress-Archive equivalent via PowerShell for parity with CI).
    const r = spawnSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${join(root, p.dll)}' -DestinationPath '${zip}' -Force`], { stdio: 'inherit' });
    if (r.status !== 0) process.exit(r.status || 1);
    console.log(`[dev] → dist/${p.asset}`);
  }
} else if (cmd === 'install') {
  // Build + drop the SINGLE self-contained dll into a plugins folder for a LIVE app test — mirrors the
  // app's install layout ({profile}/plugins/{packId}/<dll>). No zip: the pack IS one dll, so testing =
  // copy that dll into place + restart the app. Smart args: first token is an id if it matches one,
  // otherwise it's the plugins dir (install all packs there).
  const ids = new Set(manifest.plugins.map((p) => p.id));
  let id = arg, pluginsDir = process.argv[4];
  if (arg && !ids.has(arg)) { pluginsDir = arg; id = undefined; }
  const packs = id ? manifest.plugins.filter((p) => p.id === id) : manifest.plugins;
  if (id && !packs.length) { console.error(`[dev] no pack with id "${id}"`); process.exit(2); }
  const target = pluginsDir ? resolve(pluginsDir) : join(root, 'dist', 'install');
  for (const p of packs) {
    requireModel(p); build(p);
    const destDir = join(target, p.id);
    mkdirSync(destDir, { recursive: true });
    const destDll = join(destDir, basename(p.dll));
    copyFileSync(join(root, p.dll), destDll);
    console.log(`[dev] → ${destDll} (${(statSync(destDll).size / 1048576).toFixed(1)} MB single dll)`);
  }
  if (!pluginsDir) console.log(`[dev] copy dist/install/<id>/ into your app's {profile}/plugins/ and restart to test.`);
} else if (cmd === 'sdk') {
  console.log('Refresh the vendored SDK dlls from the MAIN app repo:\n  node devtools/dev.mjs plugin-sdk\nthen commit lib/ here.');
} else {
  console.log('dev: node devtools/dev.mjs <build|pack [id]|install [id] [pluginsDir]|sdk>');
  process.exit(cmd ? 0 : 1);
}
