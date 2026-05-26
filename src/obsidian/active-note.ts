import { App, MarkdownView } from "obsidian";

export class ActiveNote {
	constructor(private app: App) {}

	async getContent(): Promise<string> {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView?.file) {
			return "";
		}

		let content = activeView.getViewData();
		const frontmatter = this.app.metadataCache.getFileCache(
			activeView.file,
		)?.frontmatter;

		if (frontmatter) {
			content = content.split("---").slice(2).join("---").trim();
		}

		return content;
	}

	async insertAtFrontMatter(
		key: string,
		value: unknown,
		overwrite = true,
	): Promise<void> {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView?.file) {
			return;
		}

		await this.app.fileManager.processFrontMatter(
			activeView.file,
			(frontmatter: Record<string, unknown>) => {
				if (Object.prototype.hasOwnProperty.call(frontmatter, key) && !overwrite) {
					const existingValue = frontmatter[key];
					frontmatter[key] = appendFrontmatterValue(existingValue, value);
					return;
				}

				frontmatter[key] = value;
			},
		);
	}
}

function appendFrontmatterValue(existingValue: unknown, value: unknown): unknown[] {
	if (Array.isArray(existingValue)) {
		return existingValue.concat(value);
	}

	return [existingValue, value];
}
