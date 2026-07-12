# Rules Index — D3dxSkinManager.Plugins

One line per rule. **Scan the Applies-When column before any task**; on a match, `Read` the rule file
(bodies are NOT auto-loaded). The plugin AUTHORING contract lives in `.claude/CLAUDE.md` (mandatory
rules) + `lib/README.md` (full guide) — this index holds the cross-cutting repo rules.

| Rule | Applies When | Enforces |
|---|---|---|
| [sensitive-info.md](sensitive-info.md) | Writing ANY tracked file / commit message / rewriting history — could embed a real absolute path, Windows username, private-project name, host/LAN IP, or NSFW imagery | PUBLIC repo — never commit machine paths / private names / real IPs / explicit imagery; private context → git-ignored `local/`; a committed leak is a HISTORY problem (filter-repo). Cross-project standard (twin in the app repo) |
| [scripts-live-in-repo.md](scripts-live-in-repo.md) | Writing a helper / probe / test-fixture script; tempted to use OS temp | Dev tooling lives in `devtools/` (never `%TEMP%`); models/secrets/scratch → git-ignored `local/`; keep the dev loop prompt-free (allow-list `node devtools/dev.mjs`) |

## Invariants
- One rule file = one concern. Keep this index one-line-per-rule (pointer, not the rule body).
- New cross-cutting rule → add a file here + a row. Authoring/contract detail → CLAUDE.md / `lib/README.md`, not here.
