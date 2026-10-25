# Contributing to Journal Recap

For installation, setup, and everyday use, see the [README](README.md).

## Development setup

Use Node.js 24 LTS, selected by the repository's `.nvmrc`. Node.js 22.13 or later is also supported; CI checks Node.js 22 and 24. Use npm to install the locked dependencies:

```sh
nvm use
npm ci
```

Source lives in `src/`. Keep `src/main.ts` focused on plugin lifecycle and put feature logic in separate modules. TypeScript is bundled with esbuild into `main.js` at the plugin root.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Compile in watch mode. |
| `npm test` | Run regression tests with mocked Obsidian APIs. |
| `npm run lint` | Run Obsidian's recommended lint rules. |
| `npm run build` | Run a strict TypeScript check and production build. |
| `npm run check:release` | Validate release metadata. |
| `npm run check` | Run tests, lint, production build, and release metadata validation. |

Tests do not send notes or make paid API calls. Run `npm run check` before shipping changes. CI runs the same checks on pushes and pull requests.

Do not commit `node_modules/`, `main.js`, source maps, or other generated build output. Release assets are published separately.

## Manual testing in Obsidian

Use a separate test vault with fictional journal entries. Keep personal journal content out of test fixtures and screenshots.

1. Run `npm run build`.
2. Create this folder in the test vault:

   ```text
   TestVault/.obsidian/plugins/journal-recap/
   ```

3. Copy `main.js`, `manifest.json`, and `styles.css` into that folder.
4. Reload Obsidian and enable **Journal Recap** under **Settings → Community plugins**.
5. Follow the [README setup steps](README.md#setup) using a fictional entry. Testing the API connection or generating a recap sends a request to the configured provider and may incur charges.
6. Check that the command writes the summary to Properties, preserves the note body, and replaces the summary when run again.

Automated tests, an Obsidian walkthrough, and live API testing provide different coverage. State which checks you performed when reporting results.

## Template and tooling maintenance

Tooling follows the [official Obsidian template](https://github.com/obsidianmd/obsidian-sample-plugin), with plugin-specific source and settings preserved.

Template updates use a merge that preserves upstream ancestry. Preserve that history when merging the maintenance branch; a squash or rebase can leave GitHub's behind count unchanged.

TypeScript remains on version 6 until `typescript-eslint` supports version 7. The ESLint JavaScript config remains on version 9 to satisfy Obsidian's lint plugin.

## Releases

1. Update `minAppVersion` in `manifest.json` only if the plugin needs a newer Obsidian API.
2. Run `npm run check` and record user-visible changes in `CHANGELOG.md`.
3. From a clean, reviewed checkout, run `npm version patch` (or `minor` / `major`). This updates the package, manifest, lockfile, and compatibility history, then creates a commit and version tag.
4. Push the commit and tag, for example:

   ```sh
   git push origin master --follow-tags
   ```

5. Verify the **Release Obsidian plugin** workflow and the published release assets.

Version tags use `x.y.z`, without a `v` prefix, and must exactly match `manifest.json`. `versions.json` maps each plugin version to its minimum Obsidian version.

The release workflow rejects inconsistent metadata, runs all checks, attests build provenance, and publishes `main.js`, `manifest.json`, and `styles.css`. These files must be at the top level of the plugin folder when installed in a vault. Build output stays out of Git.

## Community directory

Follow Obsidian's [developer policies](https://docs.obsidian.md/community-directory/developer-policies), [submission requirements](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins), and [current submission process](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin) for community directory submissions or changes.

Publishing a GitHub release does not itself add a plugin to the community directory.
