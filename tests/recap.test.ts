import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { state } from "./mocks/obsidian";
import { ActiveNote } from "../src/obsidian/active-note";
import { registerSummarizeCommand } from "../src/commands/summarize";
import { generateJournalRecap } from "../src/recap/agent";
import { DEFAULT_RECAP_OUTPUT_TYPE } from "../src/recap/defaults";

beforeEach(() => {
	state.contentStart = 0;
	state.requests.length = 0;
	state.notices.length = 0;
	state.response = { status: 200, text: "" };
});

test("uses Obsidian's boundary for live frontmatter containing delimiters", async () => {
	const body = "Diary body\n---\nA horizontal rule stays.";
	const frontmatter = '---\nprivate: "abc---def"\n---\n';
	state.contentStart = frontmatter.length;
	const file = { path: "journal.md" };
	// No metadata cache: the editor can contain frontmatter not yet indexed.
	const note = new ActiveNote({ workspace: {
		getActiveViewOfType: () => ({ file, getViewData: () => frontmatter + body }),
	} } as never);
	assert.deepEqual(await note.getContent(), { file, content: body });
	assert.equal(state.parsedContent, frontmatter + body);
});

test("preserves notes without frontmatter and handles no active note", async () => {
	const file = { path: "journal.md" };
	const note = new ActiveNote({ workspace: {
		getActiveViewOfType: () => ({ file, getViewData: () => "Diary\n---\nBody" }),
	} } as never);
	assert.equal((await note.getContent())?.content, "Diary\n---\nBody");
	const empty = new ActiveNote({ workspace: { getActiveViewOfType: () => null } } as never);
	assert.equal(await empty.getContent(), null);
});

const options = {
	apiKey: "test-key",
	baseURL: "https://example.test/v1/",
	model: "test-model",
	systemPrompt: "Summarize",
	outputType: DEFAULT_RECAP_OUTPUT_TYPE,
};

test("sends structured requests without storage and extracts message output", async () => {
	state.response.text = JSON.stringify({ status: "completed", output: [
		{ type: "reasoning" },
		{ type: "message", content: [{ type: "output_text", text: '{"summary":"A day."}' }] },
	] });
	assert.deepEqual(await generateJournalRecap("Diary", options), { summary: "A day." });
	assert.equal(state.requests[0]?.url, "https://example.test/v1/responses");
	const body = JSON.parse(state.requests[0]?.body as string);
	assert.equal(body.store, false);
	assert.equal(body.input, "Diary");
	assert.deepEqual(body.text.format, DEFAULT_RECAP_OUTPUT_TYPE);
});

test("rejects API errors, refusals, incomplete responses, and invalid output", async () => {
	for (const [response, expected] of [
		[{ status: 401, text: '{"error":{"message":"Invalid key"}}' }, /Invalid key/],
		[{ status: 200, text: '{"status":"incomplete"}' }, /incomplete/],
		[{ status: 200, text: JSON.stringify({ output: [{ type: "message", content: [
			{ type: "refusal", refusal: "Cannot summarize" },
		] }] }) }, /Cannot summarize/],
		[{ status: 200, text: '{"output_text":"not JSON"}' }, /invalid JSON/],
		[{ status: 200, text: '{"output_text":"[]"}' }, /invalid output/],
	] as const) {
		state.response = response;
		await assert.rejects(generateJournalRecap("Diary", options), expected);
	}
});

test("current and legacy commands summarize the captured file", async () => {
	const commands: { id: string; callback: () => Promise<void> }[] = [];
	const plugin = {
		manifest: { name: "Journal Recap" },
		settings: { apiKey: "test-key", baseURL: options.baseURL,
			commandOption: { ...options, useCustomCommand: false } },
		addCommand: (command: typeof commands[number]) => commands.push(command),
	};
	const capturedFile = { path: "first.md" };
	const writes: unknown[][] = [];
	const note = {
		getContent: async () => ({ file: capturedFile, content: "Diary" }),
		insertAtFrontMatter: async (...args: unknown[]) => { writes.push(args); },
	};
	registerSummarizeCommand(plugin as never, note as never);
	assert.deepEqual(commands.map((command) => command.id), ["summarize-current-entry", "classify-tag-content"]);
	state.response.text = '{"output_text":"{\\"summary\\":\\"A day.\\"}"}';
	for (const command of commands) await command.callback();
	assert.deepEqual(writes, [
		[capturedFile, "summary", "A day."],
		[capturedFile, "summary", "A day."],
	]);
});
