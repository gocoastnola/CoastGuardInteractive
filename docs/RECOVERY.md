# Recovery manifest — 2026-11-17

## Verified identity and references

| Item | Value |
| --- | --- |
| Repository | `gocoastnola/CoastGuardInteractive` — https://github.com/gocoastnola/CoastGuardInteractive |
| Original recovery tag | [`pre-codex-redesign-2026-11-16`](https://github.com/gocoastnola/CoastGuardInteractive/tree/pre-codex-redesign-2026-11-16) |
| Exact underlying commit | `013fff722014729f4e044b0ce4060dbdfc3bbd57` |
| Annotated tag object | `786a60b10611f046aa60ede4fbe4643e909dd86c` |
| Freshly fetched main / development baseline | `013fff722014729f4e044b0ce4060dbdfc3bbd57` |
| Additional baseline tag | Not needed: fetched main equals the original recovery commit |
| Repair branch | `codex/zip-first-foundation-20261117-063137Z` |
| Portable bundle (outside repository) | `/workspace/coastguard-evidence/coastguard-recovery.bundle` |
| Bundle SHA-256 | `c1d23ddbb634665726d2c16ea4641977eb8762de54b9138b8b1df20d1037b477` |

Before code changes, the primary checkout was clean on `main`, with origin set to the repository above. A fresh fetch confirmed remote main. The recovery commit was verified as an existing commit; the tag name was absent locally/remotely, then created annotated and pushed. `git ls-remote --tags origin 'refs/tags/pre-codex-redesign-2026-11-16*'` returned the tag object above and peeled `^{}` target equal to the exact commit. `git bundle verify` succeeded and reported complete reachable history. A separate bundle-only clone was also tested in `/tmp/coastguard-recovery-verification`; a new recovery branch resolved to the exact original SHA. A separate clean worktree was created at `/workspace/coastguard-repair`; existing copies and the separately hosted benchmark were not edited.

The existing automation was inspected before pushing: tag pushes and task-branch pushes do not match deployment triggers. Recovery tags must not be moved, overwritten or deleted. The tag is an immutable task convention, not an indestructible service or independent hosted website. Download/store the bundle outside this execution workspace for independent retention; a local workspace path alone does not establish durable off-machine storage.

## What Git preserves

The tagged commit preserves tracked source, package lockfile, bundled ZIP data and photography, tests, documentation, workflow definitions and all history reachable from those refs. The verified bundle contains the recovery tag and fetched-main reference with their reachable history. It is not committed to this repository.

Git does not preserve remotely hosted Commons/DVIDS photograph bytes, their future availability/content, map tiles/styles/glyphs, host availability, installed Node/browser binaries, browser audio policies, repository/Pages settings, deployed artifacts, or untracked files/credentials. It does not certify unit facts, imagery licenses, operational schedules or assignments. Use ASSET_LICENSES.md and SOURCES.md when checking those dependencies.

## Verify or inspect safely

```bash
git fetch origin refs/tags/pre-codex-redesign-2026-11-16:refs/tags/pre-codex-redesign-2026-11-16
git rev-parse 'pre-codex-redesign-2026-11-16^{commit}'
git worktree add ../coastguard-recovery-review -b recovery/review-original pre-codex-redesign-2026-11-16
```

The resolved commit must equal `013fff722014729f4e044b0ce4060dbdfc3bbd57`. The commands create an isolated review branch; they do not reset main. If the local tag already exists at another target, stop rather than moving it.

To make a reviewed rollback, start another branch from freshly fetched main. Restore the selected application paths from the verified recovery tag, examine `git diff`, run the documented Node 22 checks and production-subpath browser verification, then commit and open a recovery PR. Preserve deployment/security workflow safeguards unless a reviewer explicitly approves restoring them too. Merge/deploy requires owner approval. Never force-push main.

For a bundle-only inspection in a new directory:

```bash
git bundle verify /path/to/coastguard-recovery.bundle
git clone --branch pre-codex-redesign-2026-11-16 /path/to/coastguard-recovery.bundle coastguard-recovered
cd coastguard-recovered
git switch -c recovery/review-original
git rev-parse HEAD
```

The result must be the exact original SHA above. Cloning a tag first checks out a detached commit; the next command creates a normal recovery branch. Reconnect origin only after confirming the intended repository. Do not replace an existing working directory.
