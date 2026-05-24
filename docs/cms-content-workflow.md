# CMS content workflow

Use this when Claude creates or edits blog/release JSON in `src/content`.

## Normal Claude workflow

From `F:\Project_folder\cognifocus-landingpage`:

```powershell
npm run publish:cms-content
```

That command does the steps in the safe order:

1. Stops if the local `main` branch is behind `origin/main` or has merge conflicts.
2. Runs the mojibake guard.
3. Builds the Astro site.
4. Imports local JSON into Firestore with a dry run first, then the real write.
5. Commits only `src/content/blog` and `src/content/releases`.
6. Pushes to `main`, which triggers the normal GitHub Pages deploy workflow.

## Direction of truth

- Claude edits JSON locally: `src/content` -> Firestore -> GitHub push -> deploy.
- CMS/Firestore changed elsewhere: run `Sync CMS fallback content`, then pull locally.
- Do not run Firestore -> JSON sync while Claude has local JSON edits that have not been imported yet.

## Useful options

```powershell
npm run publish:cms-content -- -SkipBuild
npm run publish:cms-content -- -SkipImport
npm run publish:cms-content -- -SkipPush
npm run publish:cms-content -- -CheckOnly
npm run publish:cms-content -- -SyncBack
```

Use `-SyncBack` only when you specifically want a follow-up Firestore -> repo JSON sync after importing local JSON.
