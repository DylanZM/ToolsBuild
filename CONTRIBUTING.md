# Contributing

Thanks for wanting to contribute to ToolsBuild. `master` is protected: **nothing lands without a pull request, green CI, and maintainer review**.

## Step-by-step workflow

1. **Fork** the repository (the *Fork* button at the top right).
2. **Clone your fork** and create a descriptive branch from `master`:

   ```bash
   git clone https://github.com/<your-username>/ToolsBuild.git
   cd ToolsBuild
   git checkout -b feat/my-improvement   # or fix/my-bug
   ```

3. **Install dependencies** (Node >= 22.12):

   ```bash
   npm ci
   ```

4. **Develop** with the local server:

   ```bash
   npm run dev
   ```

5. **Verify before pushing** — CI runs exactly this and the PR cannot be merged if it fails:

   ```bash
   npm run check
   npm run build
   ```

6. **Commit** following the repo style (`feat:`, `fix:`, `docs:`, `refactor:`):

   ```bash
   git add .
   git commit -m "feat: describe the change"
   git push origin feat/my-improvement
   ```

7. **Open the Pull Request** against `master` and fill in the template. Link the issue with `Closes #123`.

## What happens after you open the PR

- GitHub will ask a maintainer to **approve running the CI** (a security measure for fork PRs). Until then the check stays pending.
- The `ci` job must pass: `npm ci` + `npm run check` + `npm run build`.
- If `master` has moved ahead, update your branch (merge or rebase) so the PR is up to date.
- **1 approval** is required and all comments must be resolved.
- The maintainer merges with **squash**; your PR becomes a single linear commit on `master`.

## Adding website resources

All website additions go to the long-lived `resources` branch, so you do not need a new branch for each one. Edit `src/data/links.json` and run:

```bash
npm run publish:resources -- "feat: add new resources"
```

The script syncs `resources` with `master`, commits the data file, pushes, and opens or updates the PR automatically. It refuses to run if you have unrelated uncommitted changes.

To do it manually:

```bash
git checkout resources
git fetch origin && git reset --hard origin/master   # sync with master first
# edit src/data/links.json
git add src/data/links.json
git commit -m "feat: add new resources"
git push origin resources
gh pr create --base master --head resources
```

After a merge, the next script run syncs the branch again. **Do not delete the `resources` branch when merging.**

## Important rules

- **Do not upload secrets** or `.env` files. The repo is public and has push protection enabled.
- Do not modify files listed in `.gitignore` (admin panel, `dist/`, `node_modules/`).
- One PR = one coherent change. Avoid mixing large refactors with features.
- Report security issues privately (see *Security advisories*), not in a public issue.

## Local environment

Copy `.env.example` to `.env` and fill in the keys you need. The site works without keys, but AI searches stay disabled.
