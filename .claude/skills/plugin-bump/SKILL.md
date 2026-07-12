---
name: plugin-bump
description: >
  Bump ONE plugin's version across the 3-way sync (manifest `version` + csproj <Version> +
  IPlugin.Version) via devtools/dev.mjs. Use when a plugin changed and its version needs bumping,
  or when the pre-commit version-guard warned, or on /plugin-bump. NOT for the repo releaseVersion —
  the release workflow owns that (see plugin-versioning.md).
---

# /plugin-bump <id> [major|minor]

Bump a single plugin's PER-PLUGIN version everywhere it must stay in sync. Default `minor`.

Run:
```
node devtools/dev.mjs bump <id> [major|minor]
```

It updates atomically:
1. `plugins.manifest.json` → that plugin's `version`
2. its csproj `<Version>`
3. its `IPlugin.Version` literal

Then commit — the pre-commit version-guard stops warning once the version is bumped. This is the
**plugin tier**; the repo `releaseVersion` is bumped separately by the release workflow
(`workflow_dispatch` → `bump`/`version`). Full model: `.claude/rules/plugin-versioning.md`.
