import tseslint from 'typescript-eslint';
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: [
						'eslint.config.js',
						'manifest.json'
					]
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json']
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		files: ["**/*.json"],
		rules: {
			"obsidianmd/no-plugin-as-component": "off",
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		".vscode",
		"esbuild.config.mjs",
		"eslint.config.js",
		"eslint.config.mts",
		"manifest.json",
		"package-lock.json",
		"tsconfig.json",
		"version-bump.mjs",
		"versions.json",
		"main.js",
	]),
);
