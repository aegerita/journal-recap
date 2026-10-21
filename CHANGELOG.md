# Changelog

## 1.0.3

- Exclude frontmatter from API requests using Obsidian's parser, including unsaved frontmatter and YAML values containing `---`.
- Preserve custom prompts and output schemas when upgrading from 1.0.1, fill missing settings defaults, and repair the old default model typo.
- Restore the legacy command ID so existing shortcuts continue working.
- Make settings searchable in Obsidian 1.13 and later, while retaining the older settings screen.
- Explain API billing, note transmission, and key storage in settings and documentation.
- Refresh compatible dependencies, strict TypeScript checks, Obsidian lint rules, and Node.js 22/24 CI from the official plugin template.
- Add regression tests and a validated release workflow with build provenance and all three installable assets.
- Fix version bumping so every release appears in the compatibility history; restore the missing 1.0.2 entry.

Minimum Obsidian version remains 1.8.7. No model requests run during automated tests.
