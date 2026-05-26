import { Notice } from "obsidian";
import type JournalRecapPlugin from "../main";
import { ActiveNote } from "../obsidian/active-note";
import { generateJournalRecap } from "../recap/agent";
import {
	DEFAULT_RECAP_OUTPUT_TYPE,
	DEFAULT_RECAP_SYSTEM_PROMPT,
} from "../recap/defaults";

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
	const loadingNotice = new Notice(`${plugin.manifest.name}: Processing...`, 0);

	try {
		await summarize(plugin, activeNote);
	} catch (error) {
		new Notice(`${plugin.manifest.name}: ${formatError(error)}`);
	} finally {
		loadingNotice.hide();
	}
}

async function summarize(
	plugin: JournalRecapPlugin,
	activeNote: ActiveNote,
): Promise<void> {
	if (!plugin.settings.apiKey.trim()) {
		new Notice(`${plugin.manifest.name}: Add an API key in settings first.`);
		return;
	}

	const activeNoteContent = await activeNote.getContent();
	if (!activeNoteContent?.content.trim()) {
		new Notice(`${plugin.manifest.name}: No journal content found.`);
		return;
	}

	const requestTemplate = getRequestTemplate(plugin.settings.commandOption);
	const response = await generateJournalRecap(activeNoteContent.content, {
		systemPrompt: requestTemplate.systemPrompt,
		outputType: requestTemplate.outputType,
		apiKey: plugin.settings.apiKey,
		model: plugin.settings.commandOption.model,
		baseURL: plugin.settings.baseURL,
	});

	for (const key of Object.keys(response)) {
		await activeNote.insertAtFrontMatter(
			activeNoteContent.file,
			key,
			response[key],
		);
	}

	new Notice(`${plugin.manifest.name}: Summarized.`);
}

function formatError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
}

function getRequestTemplate(
	commandOption: JournalRecapPlugin["settings"]["commandOption"],
) {
	if (commandOption.useCustomCommand) {
		return {
			systemPrompt: commandOption.systemPrompt,
			outputType: commandOption.outputType,
		};
	}

	return {
		systemPrompt: DEFAULT_RECAP_SYSTEM_PROMPT,
		outputType: DEFAULT_RECAP_OUTPUT_TYPE,
	};
}
