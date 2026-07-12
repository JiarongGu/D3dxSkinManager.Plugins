---
name: plugin-new
description: >
  Scaffold a new single-DLL plugin in this repo — a csproj referencing the vendored SDK with
  Private=false, an IPlugin skeleton, a plugins.manifest.json entry, and the 3-way version sync.
  Use when starting a NEW plugin / add-on / capability pack (e.g. "new plugin", "add a plugin",
  "scaffold an image-review pack", or /plugin-new).
---

# /plugin-new <Name> [capability]

Scaffold a new plugin. `<Name>` → project + namespace `D3dxSkinManager.Plugins.<Name>`.
`capability` optional: `ImageReview` (content-veil interceptor) | omitted (plain `IPlugin` / message handler).

Full contract: **`lib/README.md`**. Reference implementation: **`D3dxSkinManager.Plugins.ContentVeil`**
(copy its csproj embedding block + `PluginBootstrap` when the pack needs native/model files).

## Steps

1. **Project** `D3dxSkinManager.Plugins.<Name>/D3dxSkinManager.Plugins.<Name>.csproj`:
   - `net10.0-windows`, `<Nullable>enable</Nullable>`, `<Version>` (SYNC — step 5).
   - Reference `..\lib\D3dxSkinManager.Core.dll` + `..\lib\D3dxSkinManager.Plugin.Sdk.dll` with
     **`<Private>false</Private>`** — the host provides those at runtime; a shipped copy = type-identity
     mismatch and the host won't see the plugin.
   - Host-provided packages (ImageSharp, …) → `Private=false` + `ExcludeAssets=runtime`.
   - Anything else the plugin needs (model, native runtime) → `EmbeddedResource` inside the one DLL
     (single-DLL pack). Models under `Models/` (git-ignored) — CI fetches them.

2. **Plugin class** `<Name>Plugin.cs` implementing `IPlugin` (or a capability interface):
   - `Id = "d3dx.<kebab-name>"`, `Name`, `Version` (SYNC), `Description`, `Author`.
   - `InitAsync(IPluginContext ctx)` — extract embedded natives/models to `ctx.GetPluginDataPath(Id)`;
     on a missing/unloadable native FAIL LOUD (throw + `ctx.Log`), then ABSTAIN — never crash the host per call.
   - `ImageReview` capability → implement `IImageReviewPlugin.ReviewImageAsync`: return the strongest
     verdict, or `null` to abstain (host keeps its own verdict).
   - Long work → `ctx.ReportProgress(title)` (host owns the status-bar/Activity entry).

3. **Manifest** — add an entry to `plugins.manifest.json` `plugins[]`:
   `{ id, name, description, version, asset: "<Name>-Plugin.zip", sdkContractVersion, project, dll, model? }`.
   `sdkContractVersion` = the `PluginSdk.ContractVersion` you built against (the app major-gates on it).

4. **Add the project to** `D3dxSkinManager.Plugins.slnx`.

5. **3-way version sync** — on ANY pack change bump ALL of: manifest `version`, `IPlugin.Version`,
   csproj `<Version>`. Out of sync → the release ships the wrong or a no-op zip.

6. **Build + local pack**: `node devtools/dev.mjs pack <id>` → `dist/<asset>` to install-test in the app
   (`{profile}/plugins/`). Release: push a `v*` tag (CI builds/carries packs + the public manifest).

## Rules
- Single-DLL packs only — embed everything (see CLAUDE.md).
- Never commit a model (`.gitignore` → `**/Models/*.onnx`); keep a local copy in `local/` for local builds.
- Public repo — no machine paths / private names / NSFW in tracked files (`.claude/rules/sensitive-info.md`).
