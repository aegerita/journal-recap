import { Notice } from "obsidian";
import type JournalRecapPlugin from "../main";
import { ActiveNote } from "../obsidian/active-note";
import { generateJournalRecap } from "../recap/agent";

export function registerSummarizeCommand(
	plugin: JournalRecapPlugin,
	activeNote: ActiveNote,
): void {
	plugin.addCommand({
		id: "summarize-current-entry",
		name: "Summarize current journal entry",
		callback: async () => {
			await runSummarize(plugin, activeNote);
		},
	});
}

async function runSummarize(
	plugin: JournalRecapPlugin,
	activeNote: ActiveNote,
) {
	const loadingNotice = createLoadingNotice(
		`${plugin.manifest.name}: Processing...`,
	);

	try {
		await summarize(plugin, activeNote);
	} catch (error) {
		new Notice(`${plugin.manifest.name}: ${formatError(error)}`);
	} finally {
		loadingNotice.hide();
	}
}

function createLoadingNotice(text: string, timeout = 10000): Notice {
	const notice = new Notice("", timeout);
	const loadingContainer = activeDocument.createElement("div");
	loadingContainer.addClass("loading-container");

	const loadingIcon = activeDocument.createElement("div");
	loadingIcon.addClass("loading-icon");

	const loadingText = activeDocument.createElement("span");
	loadingText.textContent = text;

	notice.messageEl.empty();
	loadingContainer.appendChild(loadingIcon);
	loadingContainer.appendChild(loadingText);
	notice.messageEl.appendChild(loadingContainer);

	return notice;
}

async function summarize(
	plugin: JournalRecapPlugin,
	activeNote: ActiveNote,
): Promise<void> {
	if (!plugin.settings.apiKey.trim()) {
		new Notice(`${plugin.manifest.name}: Add an API key in settings first.`);
		return;
	}

	const input = await activeNote.getContent();
	if (!input.trim()) {
		new Notice(`${plugin.manifest.name}: No journal content found.`);
		return;
	}

	const response = await generateJournalRecap(input, {
		systemPrompt: plugin.settings.commandOption.systemPrompt,
		outputType: plugin.settings.commandOption.outputType,
		apiKey: plugin.settings.apiKey,
		model: plugin.settings.commandOption.model,
		baseURL: plugin.settings.baseURL,
	});

	for (const [key, value] of Object.entries(response)) {
		await activeNote.insertAtFrontMatter(key, value);
	}

	new Notice(`${plugin.manifest.name}: Summarized.`);
}

function formatError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
}
