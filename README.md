# Journal Recap

`Journal Recap` is an [Obsidian](https://obsidian.md/) plugin that summarizes daily journal entries with the OpenAI Responses API. It writes a one-sentence summary into the note frontmatter.

## Original Project

This plugin is based on [Auto Classifier](https://github.com/HyeonseoNam/auto-classifier?tab=readme-ov-file) by [Hyeonseo Nam](https://github.com/HyeonseoNam).

## Usage

- Configure your API key, base endpoint, and model in the plugin settings.
- OpenAI requires an API account with available billing or credits. API usage is billed separately from ChatGPT subscriptions.
- Run **Summarize current journal entry** from the command palette.
- Optionally enable a custom prompt and response schema in advanced settings.

## Privacy and data

- When you run **Summarize current journal entry**, the current note content, excluding frontmatter, is sent to the configured Responses API endpoint with the configured prompt and structured output schema.
- The API test button sends a short test message to the same endpoint.
- The generated response is written back to the active note frontmatter.
- Your API key, base endpoint, model, prompt, and schema are stored in Obsidian's plugin data for this vault.
- Requests include `store: false` for OpenAI Responses API calls.
- This plugin does not include telemetry or send data anywhere except the endpoint you configure.

## Development

- Use Node.js 24 LTS (`nvm use`), or Node.js 22.13 or later.
- Install the locked dependencies with `npm ci`.
- Run `npm run dev` to compile in watch mode.
- Run `npm run build` for a production build.
- Run `npm run check` before shipping changes. It runs regression tests, Obsidian's recommended lint rules, a strict TypeScript production build, and release metadata validation.
- Tests use mocked Obsidian APIs. They do not send notes or make paid API calls.
- CI checks Node.js 22 and 24. Tooling follows the [official Obsidian template](https://github.com/obsidianmd/obsidian-sample-plugin), with plugin-specific source and settings preserved.
- Template updates use a merge that preserves upstream ancestry. Preserve that history when merging the maintenance branch; a squash or rebase can leave GitHub's behind count unchanged.
- TypeScript remains on version 6 until `typescript-eslint` supports version 7. The ESLint JavaScript config remains on version 9 to satisfy Obsidian's lint plugin.

## Manual Installation

Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/aegerita/journal-recap/releases/latest), then copy them to:

```text
VaultFolder/.obsidian/plugins/journal-recap/
```

## Releases

1. Update `minAppVersion` in `manifest.json` only if the plugin needs a newer Obsidian API.
2. Run `npm run check` and record user-visible changes in `CHANGELOG.md`.
3. From a clean, reviewed checkout, run `npm version patch` (or `minor` / `major`). This updates package, manifest, lockfile, and compatibility history, then creates a commit and version tag.
4. Push the commit and tag, for example `git push origin master --follow-tags`.
5. Verify the **Release Obsidian plugin** workflow and the published release assets.

Version tags use `x.y.z`, without a `v` prefix. The release workflow rejects inconsistent metadata, runs all checks, attests the build, and publishes `main.js`, `manifest.json`, and `styles.css`. Build output stays out of Git.

## Adding your plugin to the community plugin list

Follow Obsidian's [developer policies](https://docs.obsidian.md/community-directory/developer-policies), [submission requirements](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins), and [current submission process](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin). Publishing a GitHub release does not itself add this plugin to the community directory.

## License

This project uses the Dynalist permissive license included in [LICENSE](LICENSE).
