import { App, getFrontMatterInfo, MarkdownView, type TFile } from "obsidian";

export interface ActiveNoteContent {
	file: TFile;
	content: string;
}

export class ActiveNote {
	constructor(private app: App) {}

	async getContent(): Promise<ActiveNoteContent | null> {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView?.file) {
			return null;
		}

		const content = activeView.getViewData();
		const { contentStart } = getFrontMatterInfo(content);

		return {
			file: activeView.file,
			content: content.slice(contentStart).trim(),
		};
	}

	async insertAtFrontMatter(
		file: TFile,
		key: string,
		value: unknown,
		overwrite = true,
	): Promise<void> {
		await this.app.fileManager.processFrontMatter(
			file,
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
