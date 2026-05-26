import { requestUrl, type RequestUrlResponse } from "obsidian";
import type { ResponseTextFormat } from "./types";

interface GenerateJournalRecapOptions {
	apiKey: string;
	baseURL: string;
	model: string;
	systemPrompt: string;
	outputType: ResponseTextFormat;
}

export async function generateJournalRecap(
	journalEntry: string,
	options: GenerateJournalRecapOptions,
): Promise<Record<string, unknown>> {
	const response = await requestUrl({
		url: buildResponsesUrl(options.baseURL),
		method: "POST",
		contentType: "application/json",
		headers: {
			Authorization: `Bearer ${options.apiKey}`,
		},
		body: JSON.stringify({
			model: options.model,
			instructions: options.systemPrompt,
			input: journalEntry,
			text: {
				format: options.outputType,
			},
			store: false,
		}),
		throw: false,
	});

	const responseBody = readJsonResponse(response);
	if (response.status < 200 || response.status >= 300) {
		throw new Error(formatApiError(response, responseBody));
	}

	const outputText = getResponseOutputText(responseBody);
	const output = parseJsonOutput(outputText);
	if (!isRecord(output)) {
		throw new Error("The Responses API returned an invalid output.");
	}

	return output;
}

function buildResponsesUrl(baseURL: string): string {
	const normalizedBaseURL = baseURL.trim().replace(/\/+$/, "");
	if (normalizedBaseURL.endsWith("/responses")) {
		return normalizedBaseURL;
	}

	return `${normalizedBaseURL}/responses`;
}

function readJsonResponse(response: RequestUrlResponse): unknown {
	if (!response.text.trim()) {
		return null;
	}

	try {
		return JSON.parse(response.text);
	} catch {
		return response.text;
	}
}

function getResponseOutputText(responseBody: unknown): string {
	if (!isRecord(responseBody)) {
		throw new Error("The Responses API returned an invalid response.");
	}

	const apiError = getApiErrorMessage(responseBody);
	if (apiError) {
		throw new Error(apiError);
	}

	const status = responseBody.status;
	if (typeof status === "string" && status !== "completed") {
		throw new Error(`The Responses API returned status "${status}".`);
	}

	if (typeof responseBody.output_text === "string") {
		return responseBody.output_text;
	}

	const outputText = getOutputContentText(responseBody.output);
	if (!outputText) {
		throw new Error("The Responses API returned no text output.");
	}

	return outputText;
}

function getOutputContentText(output: unknown): string {
	if (!Array.isArray(output)) {
		return "";
	}

	const outputTextParts: string[] = [];
	for (const outputItem of output) {
		if (!isRecord(outputItem) || outputItem.type !== "message") {
			continue;
		}

		const content = outputItem.content;
		if (!Array.isArray(content)) {
			continue;
		}

		for (const contentItem of content) {
			if (!isRecord(contentItem)) {
				continue;
			}

			if (contentItem.type === "refusal") {
				throw new Error(getRefusalMessage(contentItem));
			}

			if (
				(contentItem.type === "output_text" || contentItem.type === "text") &&
				typeof contentItem.text === "string"
			) {
				outputTextParts.push(contentItem.text);
			}
		}
	}

	return outputTextParts.join("\n").trim();
}

function getRefusalMessage(contentItem: Record<string, unknown>): string {
	if (typeof contentItem.refusal === "string") {
		return contentItem.refusal;
	}

	return "The model refused to generate a recap for this note.";
}

function parseJsonOutput(outputText: string): unknown {
	try {
		return JSON.parse(outputText);
	} catch {
		throw new Error("The Responses API returned invalid JSON.");
	}
}

function formatApiError(
	response: RequestUrlResponse,
	responseBody: unknown,
): string {
	const apiError = getApiErrorMessage(responseBody);
	if (apiError) {
		return apiError;
	}

	return `Responses API request failed (${response.status}).`;
}

function getApiErrorMessage(value: unknown): string | null {
	if (!isRecord(value)) {
		return null;
	}

	const { error } = value;
	if (isRecord(error) && typeof error.message === "string") {
		return error.message;
	}

	if (typeof value.message === "string") {
		return value.message;
	}

	return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
