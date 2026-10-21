import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeSettings } from "../src/settings-data";
import { DEFAULT_RECAP_OUTPUT_TYPE } from "../src/recap/defaults";
import type { JournalRecapSettings } from "../src/settings";

const defaults: JournalRecapSettings = {
	apiKey: "",
	apiKeyTestedAt: null,
	baseURL: "https://api.openai.com/v1",
	commandOption: {
		useCustomCommand: false,
		systemPrompt: "Default prompt",
		outputType: DEFAULT_RECAP_OUTPUT_TYPE,
		model: "gpt-4o-mini",
	},
};

test("migrates version 1.0.1 custom settings without losing user choices", () => {
	const schema = {
		name: "custom",
		strict: true,
		schema: { type: "object", properties: { events: { type: "array" } } },
	};
	const saved = {
		apiKey: "test-key",
		apiKeyCreatedAt: "2025-01-16T16:00:00.000Z",
		baseURL: "https://example.test/v1",
		commandOption: {
			key: "tags",
			useCustomCommand: true,
			system_prompt: "My saved custom prompt",
			response_schema: { type: "json_schema", json_schema: schema },
			model: "my-custom-model",
		},
	};
	const settings = mergeSettings(defaults, saved);
	assert.equal(settings.apiKey, saved.apiKey);
	assert.equal(settings.apiKeyTestedAt, saved.apiKeyCreatedAt);
	assert.equal(settings.baseURL, saved.baseURL);
	assert.deepEqual(settings.commandOption, {
		useCustomCommand: true,
		systemPrompt: saved.commandOption.system_prompt,
		outputType: { ...schema, type: "json_schema" },
		model: "my-custom-model",
	});
	assert.equal(saved.commandOption.response_schema.json_schema, schema);
});

test("fills partial settings and repairs the old default model typo", () => {
	const settings = mergeSettings(defaults, {
		commandOption: { model: "gpt-4.0-mini" },
	});
	assert.deepEqual(settings, defaults);
});

test("preserves current fields before legacy fields and clones nested data", () => {
	const settings = mergeSettings(defaults, {
		apiKeyTestedAt: "2026-10-20T12:00:00.000Z",
		commandOption: {
			systemPrompt: "",
			system_prompt: "Legacy prompt",
			outputType: { type: "json_object" },
			response_schema: { type: "json_schema", json_schema: {} },
		},
	});
	assert.equal(settings.commandOption.systemPrompt, "");
	assert.deepEqual(settings.commandOption.outputType, { type: "json_object" });
	assert.equal(settings.apiKeyTestedAt, "2026-10-20T12:00:00.000Z");

	const first = mergeSettings(defaults, null);
	const second = mergeSettings(defaults, null);
	assert.notEqual(first.commandOption, defaults.commandOption);
	assert.notEqual(first.commandOption.outputType, second.commandOption.outputType);
	assert.notEqual(first.commandOption.outputType, defaults.commandOption.outputType);
	if (first.commandOption.outputType.type === "json_schema") {
		first.commandOption.outputType.schema.properties = {};
	}
	assert.deepEqual(second.commandOption.outputType, DEFAULT_RECAP_OUTPUT_TYPE);
});

test("does not restore a legacy API test date after the key was changed", () => {
	const settings = mergeSettings(defaults, {
		apiKeyTestedAt: null,
		apiKeyCreatedAt: "2025-01-16T16:00:00.000Z",
	});
	assert.equal(settings.apiKeyTestedAt, null);
});

test("ignores malformed saved settings and schemas", () => {
	for (const value of [undefined, null, false, "bad", [], { commandOption: null }]) {
		assert.deepEqual(mergeSettings(defaults, value), defaults);
	}
	assert.deepEqual(mergeSettings(defaults, {
		apiKey: 7,
		apiKeyTestedAt: "invalid-date",
		baseURL: [],
		commandOption: {
			useCustomCommand: "true",
			systemPrompt: null,
			outputType: { type: "json_schema", name: "bad", schema: null },
			model: " ",
		},
	}), defaults);
});
