# D3dxSkinManager.Plugins

Official + example plugins for [D3dxSkinManager](https://github.com/JiarongGu/D3dxSkinManager). Each plugin
is a single .NET DLL the app loads from `{profile}/plugins/**` (or installs in-app).

## Layout

```
lib/                 vendored plugin SDK dlls (tracked) — the contract plugins build against:
  D3dxSkinManager.Core.dll        (shared contracts + host abstractions)
  D3dxSkinManager.Plugin.Sdk.dll  (plugin authoring SDK; references Core)
  README.md                       (the SDK authoring guide — start here)
<Plugin>/            one folder per plugin (csproj references ..\lib\*.dll with Private=false)
plugins.manifest.json  source of truth for official packs (id/name/version/asset/…)
.github/workflows/   release: build/carry packs + publish plugins-manifest.json
devtools/dev.mjs     the plugin dev loop
```

## The SDK is vendored (for now)

`lib/*.dll` are published from the main app repo:

```
# in the main app repo:
node devtools/dev.mjs plugin-sdk        # builds the SDK + copies the dlls (+ guide) into ../D3dxSkinManager.Plugins/lib
```

Re-run it whenever the Core contracts change, then commit `lib/`. (A NuGet package is the planned successor.)
Reference the dlls with **`<Private>false</Private>`** — the host provides them at runtime; shipping a
second copy causes a type-identity mismatch. See **[lib/README.md](lib/README.md)** for the full guide.

## Writing a plugin

See **[lib/README.md](lib/README.md)** — the SDK authoring guide (layering, `IPlugin`/`IPluginContext`,
capability interfaces, single-DLL packaging, manifest + versioning, lifecycle).

## Releasing

Bump the pack's `version` in `plugins.manifest.json` **and** the plugin's `IPlugin.Version` + csproj
`<Version>` (keep all three in sync), then cut a release — the workflow builds the pack (or carries the
last zip forward if unchanged) and attaches `plugins-manifest.json`, which the app reads to offer updates.
