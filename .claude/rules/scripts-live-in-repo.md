# Helper scripts live in the repo, never in OS temp — and the dev loop stays prompt-free

Any script, probe, or throwaway you write to develop/test a plugin goes **inside the repo**
(`devtools/`), never in `%TEMP%` / OS temp. Private scratch (a local model copy, a sample archive,
secrets) goes in git-ignored `local/`. Adapted from the app repo's convention.

## Why
- **Allow-listing.** A repo-relative command (`node devtools/dev.mjs …`) is covered by one
  `.claude/settings.json` allow rule → runs unattended. A random temp path prompts every time.
- **Reuse.** In-repo tools are committed + improvable; temp scratch is lost and rewritten.
- **Public-repo safety.** Scratch/models/secrets in `local/` (git-ignored) can't leak into a commit
  (see `sensitive-info.md`).

## Rules
1. Dev tooling → `devtools/` (real name + header comment). Keep it zero-dep (Node 24 globals). The
   dispatcher is `devtools/dev.mjs` (`build` / `pack [id]` / `sdk`) — add an action there when a
   dev/test step recurs, rather than an ad-hoc script.
2. Private / machine-local / model / secret files → git-ignored `local/`. Never commit them.
3. Add an allow rule in `.claude/settings.json` for any new command so the loop stays prompt-free. The
   single `Bash(node devtools/dev.mjs:*)` rule already covers everything routed through the dispatcher.

## Keep commands prompt-free
- **Never prefix a command with `cd <dir>;`** — the Bash tool's working dir is already the repo root; a
  `cd …;` trips a safety check that overrides the allow-list and prompts.
- Inspect code with the Grep / Read / Glob tools, not Bash `grep`/`cat`/`ls`/`find`.
- Reserve Bash for allow-listed commands (`node devtools/dev.mjs`, `dotnet build/test`, `git`).
