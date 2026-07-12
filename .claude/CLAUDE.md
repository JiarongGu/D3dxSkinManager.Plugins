# CLAUDE.md — D3dxSkinManager.Plugins (plugin repo)

> Plugins for [D3dxSkinManager](https://github.com/JiarongGu/D3dxSkinManager). Each plugin is a single
> .NET DLL the app loads from `{profile}/plugins/**`. Full authoring guide: **`lib/README.md`**.

## Mandatory rules

1. **Reference the vendored SDK, never ship it.** Plugins compile against `lib/D3dxSkinManager.Core.dll`
   + `lib/D3dxSkinManager.Plugin.Sdk.dll` with **`<Private>false</Private>`**. The host provides those at
   runtime; shipping a second copy causes a type-identity mismatch and the host won't see your plugin.

2. **Single-DLL packs.** Everything a plugin needs (models, native runtimes) is `EmbeddedResource` inside
   the one plugin DLL and extracted to `IPluginContext.GetPluginDataPath(Id)` on first use. Host-provided
   packages (ImageSharp, …) → `Private=false` + `ExcludeAssets=runtime`. The release ships ONLY the plugin dll.

3. **3-way version sync (or the release ships the wrong/no-op zip).** On any pack change bump ALL of:
   `plugins.manifest.json` → `version`, the plugin's `IPlugin.Version`, and its csproj `<Version>`.
   Also set `sdkContractVersion` in the manifest to `PluginSdk.ContractVersion` you built against.

4. **Models are fetched by CI**, not committed (`.gitignore` excludes `**/Models/*.onnx`). CI downloads
   from the manifest's `model.url` and verifies `model.sha256`. Keep a local copy to build locally.

5. **Refresh the SDK from the app repo, don't hand-edit `lib/`.** When the Core contracts change, run
   `node devtools/dev.mjs plugin-sdk` in the MAIN app repo (publishes the dlls here), then commit `lib/`.

6. **Fail native/model loads LOUD** (throw + log, then abstain) — never crash the host per-call. See the
   ContentVeil plugin (`PluginBootstrap` + `InitAsync`) as the reference.

## Dev loop

- `node devtools/dev.mjs build` — build every pack (Release).
- `node devtools/dev.mjs pack [id]` — build + zip pack dll(s) into `dist/` for a local install test.
- Release: push a `v*` tag (or run the workflow) → builds/carries packs + publishes `plugins-manifest.json`.

## Layout

`lib/` vendored SDK · `<Plugin>/` one folder per plugin · `plugins.manifest.json` source of truth ·
`.github/workflows/release.yml` release · `devtools/` dev tooling · `dist/` local pack output
(git-ignored) · `local/` private scratch/models (git-ignored).

## Rules & skills

- **Rules** → scan `.claude/rules/RULES_INDEX.md` before a task, `Read` matched files.
  `sensitive-info.md` = PUBLIC-repo safety (no machine paths / private names / NSFW in tracked files);
  `scripts-live-in-repo.md` = tooling in `devtools/`, private scratch/models in git-ignored `local/`.
- **Skills** → `/plugin-new <Name> [capability]` scaffolds a new single-DLL plugin (csproj + `IPlugin` +
  manifest entry + 3-way version sync); `/caveman` = terse mode.

## Git

**Never commit without explicit approval.** End commit messages with the Co-Authored-By trailer.
