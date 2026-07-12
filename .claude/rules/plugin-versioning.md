# Plugin versioning — two tiers: repo releaseVersion + per-plugin version

**Two separate version numbers, bumped by two separate processes. Don't conflate them.**

## The two tiers

| Tier | Where | Bumped by | Means |
|---|---|---|---|
| **Release version** | `plugins.manifest.json` → `releaseVersion` | the RELEASE WORKFLOW (`workflow_dispatch` → `version`/`bump`, like the app) — commits it + tags `vX.Y` | one number for the whole repo/release; stamped into the published `plugins-manifest.json` |
| **Plugin version** | each plugin's `version` (manifest) **+** csproj `<Version>` **+** `IPlugin.Version` (the 3-way sync) | the DEV, via `node devtools/dev.mjs bump <id> [major\|minor]` | that ONE plugin's own iteration; the build carries an unchanged pack forward, rebuilds a changed one |

## Why two tiers

A plugin changes on its own schedule, independent of when you cut a repo release. The **release version**
marks "a release happened" — it drives the tag + release notes (mirrors the app's single-version flow).
The **plugin version** marks "this plugin changed" — it's the signal the release build keys off
(carry-forward compares each pack's `version` to the last published manifest: same ⇒ carry the old zip,
different ⇒ rebuild). You can't auto-detect "which plugin changed, and is it major or minor" from a git
diff — semver is a human call — so the plugin bump is a deliberate dev act, not CI magic. A pre-commit
hook only *reminds* you.

## How to apply

- **Changed a plugin?** `node devtools/dev.mjs bump <id> [major|minor]` (default minor) — updates all 3
  places atomically. Install the guard once (`node devtools/dev.mjs hooks install`): the pre-commit hook
  then WARNS (never blocks) if you staged a plugin's files without bumping its version.
- **Cutting a release?** Actions → **Release plugins** → Run workflow (pick `bump`, or an explicit
  `version`) → bumps `releaseVersion`, commits, tags `vX.Y`, builds/carries packs, publishes. Or push a
  `vX.Y` tag directly (that path skips the bump — the tag IS the release version).
- **Don't** hand-edit `releaseVersion` (the workflow owns it) or hand-bump a plugin's 3 places (use the
  helper — the hook guards it; a partial bump ships the wrong/no-op zip).

## Related
- [scripts-live-in-repo.md](scripts-live-in-repo.md) — the hook + bump live in `devtools/`.
- `plugins.manifest.json` `_releaseVersionNote` / `_comment` — inline source-of-truth notes.
- CLAUDE.md mandatory rule #3 (3-way sync) + `lib/README.md` (authoring).
