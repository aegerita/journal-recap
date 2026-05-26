import { Agent, OpenAIProvider, Runner, type JsonSchemaDefinition } from "@openai/agents";
import OpenAI from "openai";

interface GenerateJournalRecapOptions {
	apiKey: string;
	baseURL: string;
	model: string;
	systemPrompt: string;
	outputType: JsonSchemaDefinition;
}

export async function generateJournalRecap(
	journalEntry: string,
	options: GenerateJournalRecapOptions,
): Promise<Record<string, unknown>> {
	const agent = new Agent({
		name: "Journal recap",
		instructions: options.systemPrompt,
		model: options.model,
		outputType: options.outputType,
	});

	const runner = new Runner({
		modelProvider: new OpenAIProvider({
			openAIClient: new OpenAI({
				apiKey: options.apiKey,
				baseURL: options.baseURL,
				dangerouslyAllowBrowser: true,
			}),
			useResponses: true,
		}),
		tracingDisabled: true,
		traceIncludeSensitiveData: false,
	});

	const result = await runner.run(agent, journalEntry);
	const output = result.finalOutput;
	if (!isRecord(output)) {
		throw new Error("The recap agent returned an invalid output.");
	}

	return output;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
