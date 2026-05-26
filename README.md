# Journal Recap

`Journal Recap` is an [Obsidian](https://obsidian.md/) plugin that summarizes daily journal entries with the OpenAI Responses API. It writes a one-sentence summary into the note frontmatter.

## Original Project

This plugin is based on [Auto Classifier](https://github.com/HyeonseoNam/auto-classifier?tab=readme-ov-file) by [Hyeonseo Nam](https://github.com/HyeonseoNam).

## Usage

- Configure your API key, base endpoint, and model in the plugin settings.
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

- Install dependencies with `npm install`.
- Run `npm run dev` to compile in watch mode.
- Run `npm run build` for a production build.
- Run `npm run lint` before shipping changes.

## Manual Installation

Copy `main.js`, `manifest.json`, and `styles.css` to:

```text
VaultFolder/.obsidian/plugins/journal-recap/
```

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`.
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

## License

This project uses the Dynalist permissive license included in [LICENSE](LICENSE).
