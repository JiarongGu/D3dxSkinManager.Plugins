# Sensitive info — keep dev-machine + private data out of tracked files

**This repo is PUBLIC (`github.com/JiarongGu/D3dxSkinManager.Plugins`). Nothing that identifies the
author's machine, their other projects, or private data may land in a tracked file, a commit message,
or git history — not even after the working tree looks clean. Private context lives in git-ignored `local/`.**

## Why

A committed leak is not a working-tree problem — it's in every past commit + message, public on push,
and only a full `git filter-repo` rewrite (every SHA changes) + force-push removes it. The app repo
had exactly this (an explicit doc screenshot, a Windows username in a `.csproj` HintPath, dev-folder
paths + a sibling-project name across commit bodies) — an hour of irreversible surgery for data that
never needed committing. Prevention is ~free. (Cross-project standard — the app repo carries the twin.)

This repo ships an AI pack (ContentVeil) whose model is trained on explicit imagery — the corpus/model
handling makes the NSFW rule especially load-bearing here.

## The rules (never in a tracked file or commit message)

- **No absolute local paths.** `<drive>:\<dev-root>\…`, `C:\Users\<user>\…`, mapped drives. Use a
  repo-relative path or a neutral placeholder (`<repo>`, `%USERPROFILE%`); real path → `local/`.
- **No private-project names.** The author's other apps by name — refer to them generically.
- **No personal / network specifics.** Real host/NAS names, LAN IPs (`192.168.x.x`), the author's
  name/email in file *content* (git authorship / LICENSE is fine).
- **No explicit / NSFW imagery.** Pack models train on explicit data — keep any corpus/sample imagery
  ONLY in git-ignored `local/` (or `devtools/fixtures/` if added). Never a tracked doc screenshot.
- **No absolute NuGet HintPaths.** Prefer `PackageReference`; never let VS write
  `<Reference Update="C:\Users\...\.nuget\...">`.
- **Working/private files stay inside the repo** — `devtools/` for scratch/probes, git-ignored `local/`
  for private/backup/models. Never a sibling backup folder elsewhere under the dev root.

## How to apply

- **Before committing, grep the diff for leaks:**
  `git diff --cached | grep -inE 'C:\\Users|<drive>:\\|192\.168\.'` → hit? move the value to `local/`.
- New machine/private context → a file under git-ignored `local/`, not a tracked file.
- **Edge cases where the rule does NOT apply:** fictional example paths (`C:\Games\MyGame`) and generic
  UNC (`\\host\share`) in docs are fine — they reveal nothing real. The maintainer's Git author
  name/email is the public GitHub identity — intentional, leave it. The public plugin/app repo URLs
  (`github.com/JiarongGu/…`) are intended public references, not leaks.

## Remediation

A committed leak needs a history rewrite (`git filter-repo --replace-text` for blobs AND
`--replace-message` for commit bodies, case-sensitive, sweep short forms) + a force-push. Author the
rules file with the Write tool using LITERAL placeholders — never quote the real path/name in the rule
itself (a `--replace-text` pass would mangle or re-leak it). Force-push only with explicit user go-ahead.
