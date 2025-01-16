import { App, MarkdownView, Editor, FrontMatterCache } from "obsidian";

export class ViewManager {
    app: App;

    constructor(app: App) {
        this.app = app;
    }

    async getSelection(editor?: Editor): Promise<string | null> {
        if (editor) {
            return editor.getSelection();
        }
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            return activeView.editor.getSelection();
        }
        return null;
    }

    async getTitle(): Promise<string | null> {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView && activeView.file) {
            return activeView.file.basename;
        }
        return null;
    }

    async getFrontMatter(): Promise<string | null> {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView && activeView.file) {
            const file = activeView.file;
            const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter as Partial<FrontMatterCache>;
            if (frontmatter?.position) {
                delete frontmatter.position;
            }
            return JSON.stringify(frontmatter);
        }
        return null;
    }

    async getContent(): Promise<string | null> {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView && activeView.file) {
            // delete frontmatter
            let content = activeView.getViewData();
            const file = activeView.file;
            const frontmatter: FrontMatterCache | undefined = this.app.metadataCache.getFileCache(file)?.frontmatter;
            if (frontmatter) {
                content = content.split('---').slice(2).join('---');
            }
            return content;
        }
        return null;
    }

    async insertAtFrontMatter(key: string, value: string, overwrite: boolean = true): Promise<void> {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

        if (activeView && activeView.file) {
            const file = activeView.file;
            await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
                frontmatter = frontmatter || {};

                if (frontmatter[key] && !overwrite) {
                    // add value as list element if exist
                    if (Array.isArray(frontmatter[key])) {
                        frontmatter[key].push(value);
                    } else {
                        frontmatter[key] = [frontmatter[key], value];
                    }
                } else {
                    // overwrite
                    frontmatter[key] = value;
                }
            });
        }
    }
}