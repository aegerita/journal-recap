import type { JournalRecapSettings } from "./settings";
import type { ResponseTextFormat } from "./recap/types";

export function mergeSettings(
	defaults: JournalRecapSettings,
	savedData: unknown,
): JournalRecapSettings {
	const saved = isRecord(savedData) ? savedData : {};
	const command = isRecord(saved.commandOption) ? saved.commandOption : {};
	const defaultCommand = defaults.commandOption;
	const model = nonEmptyString(command.model) ?? defaultCommand.model;
	const testedAt = saved.apiKeyTestedAt === undefined
		? saved.apiKeyCreatedAt
		: saved.apiKeyTestedAt;

	return {
		apiKey: typeof saved.apiKey === "string" ? saved.apiKey : defaults.apiKey,
		apiKeyTestedAt:
			typeof testedAt === "string" && Number.isFinite(Date.parse(testedAt))
				? testedAt
				: null,
		baseURL: nonEmptyString(saved.baseURL) ?? defaults.baseURL,
		commandOption: {
			useCustomCommand:
				typeof command.useCustomCommand === "boolean"
					? command.useCustomCommand
					: defaultCommand.useCustomCommand,
			systemPrompt:
				typeof command.systemPrompt === "string"
					? command.systemPrompt
					: typeof command.system_prompt === "string"
						? command.system_prompt
						: defaultCommand.systemPrompt,
			outputType: JSON.parse(JSON.stringify(
				readOutputType(command.outputType) ??
				readOutputType(command.response_schema) ??
				defaultCommand.outputType,
			)) as ResponseTextFormat,
			// Version 1.0.1 shipped this misspelled model identifier as its default.
			model: model === "gpt-4.0-mini" ? defaultCommand.model : model,
		},
	};
}

function readOutputType(value: unknown): ResponseTextFormat | null {
	if (!isRecord(value)) {
		return null;
	}

	if (value.type === "json_object") {
		return value as ResponseTextFormat;
	}

	if (value.type !== "json_schema") {
		return null;
	}

	const format = isRecord(value.json_schema)
		? { ...value.json_schema, type: "json_schema" }
		: value;
	if (
		typeof format.name !== "string" ||
		!isRecord(format.schema) ||
		(format.strict !== undefined && typeof format.strict !== "boolean")
	) {
		return null;
	}

	return format as ResponseTextFormat;
}

function nonEmptyString(value: unknown): string | null {
	return typeof value === "string" && value.trim() ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
