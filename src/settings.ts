import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type JournalRecapPlugin from "./main";
import { generateJournalRecap } from "./recap/agent";
import {
	DEFAULT_RECAP_OUTPUT_TYPE,
	DEFAULT_RECAP_SYSTEM_PROMPT,
} from "./recap/defaults";
import type { ResponseTextFormat } from "./recap/types";

export interface CommandOption {
	useCustomCommand: boolean;
	systemPrompt: string;
	outputType: ResponseTextFormat;
	model: string;
}

export interface JournalRecapSettings {
	apiKey: string;
	apiKeyTestedAt: string | null;
	baseURL: string;
	commandOption: CommandOption;
}

export const DEFAULT_SETTINGS: JournalRecapSettings = {
	apiKey: "",
	apiKeyTestedAt: null,
	baseURL: "https://api.openai.com/v1",
	commandOption: {
		useCustomCommand: false,
		systemPrompt: DEFAULT_RECAP_SYSTEM_PROMPT,
		outputType: DEFAULT_RECAP_OUTPUT_TYPE,
		model: "gpt-4o-mini",
	},
};

export class JournalRecapSettingTab extends PluginSettingTab {
	plugin: JournalRecapPlugin;

	constructor(app: App, plugin: JournalRecapPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const commandOption = this.plugin.settings.commandOption;

		containerEl.empty();

		new Setting(containerEl).setName("Connection").setHeading();

		new Setting(containerEl)
			.setName("Model")
			.setDesc("Model identifier.")
			.addText((text) =>
				text
					.setValue(commandOption.model)
					.onChange(async (value) => {
						commandOption.model = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Base endpoint")
			.setDesc(
				"Use the default OpenAI endpoint or a compatible responses endpoint.",
			)
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.baseURL)
					.setValue(this.plugin.settings.baseURL)
					.onChange(async (value) => {
						this.plugin.settings.baseURL = value.trim() || DEFAULT_SETTINGS.baseURL;
						await this.plugin.saveSettings();
					}),
			);

		const apiKeySetting = new Setting(containerEl)
			.setName("API key")
			.setDesc("")
			.addText((text) => {
				text.inputEl.type = "password";
				text
					.setPlaceholder("API key")
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value.trim();
						this.plugin.settings.apiKeyTestedAt = null;
						await this.plugin.saveSettings();
					});
			});

		apiKeySetting.descEl.createSpan({
			text: "Enter the API key for your configured endpoint.",
		});
		const apiTestMessageEl = apiKeySetting.descEl.createDiv();
		this.renderApiTestMessage(apiTestMessageEl);

		apiKeySetting.addButton((button) => {
			button
				.setButtonText("Test API call")
				.setCta()
				.onClick(async () => {
					apiTestMessageEl.setText("Testing API call...");

					try {
						await generateJournalRecap("Test connection", {
							systemPrompt: "Return a valid JSON response for the requested schema.",
							outputType: DEFAULT_RECAP_OUTPUT_TYPE,
							apiKey: this.plugin.settings.apiKey,
							model: this.plugin.settings.commandOption.model,
							baseURL: this.plugin.settings.baseURL,
						});

						this.plugin.settings.apiKeyTestedAt = new Date().toISOString();
						await this.plugin.saveSettings();
						this.renderApiTestMessage(apiTestMessageEl);
					} catch (error) {
						this.plugin.settings.apiKeyTestedAt = null;
						await this.plugin.saveSettings();
						apiTestMessageEl.setText(`Error: ${formatError(error)}`);
					}
				});
		});

		new Setting(containerEl).setName("Advanced").setHeading();

		new Setting(containerEl)
			.setName("Use custom request template")
			.addToggle((toggle) =>
				toggle
					.setValue(commandOption.useCustomCommand)
					.onChange(async (value) => {
						commandOption.useCustomCommand = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (!commandOption.useCustomCommand) {
			return;
		}

		const promptTemplateSetting = new Setting(containerEl)
			.setName("Custom prompt template")
			.setClass("setting-item-child")
			.setClass("block-control-item")
			.setClass("height20-text-area")
			.addTextArea((text) =>
				text
					.setPlaceholder("Write a custom system prompt.")
					.setValue(commandOption.systemPrompt)
					.onChange(async (value) => {
						commandOption.systemPrompt = value;
						await this.plugin.saveSettings();
					}),
			)
			.addExtraButton((button) => {
				button
					.setIcon("reset")
					.setTooltip("Restore default")
					.onClick(async () => {
						commandOption.systemPrompt = DEFAULT_RECAP_SYSTEM_PROMPT;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		promptTemplateSetting.descEl.createSpan({
			text: "The model uses this as the system prompt.",
		});

		const outputSchemaSetting = new Setting(containerEl)
			.setName("Custom output schema")
			.setClass("setting-item-child")
			.setClass("block-control-item")
			.setClass("height20-text-area")
			.addTextArea((text) =>
				text
					.setPlaceholder("Write a structured output schema.")
					.setValue(JSON.stringify(commandOption.outputType, null, 2))
					.onChange(async (value) => {
						try {
							commandOption.outputType = JSON.parse(value) as ResponseTextFormat;
							await this.plugin.saveSettings();
						} catch {
							new Notice("Custom output schema is not valid JSON.");
						}
					}),
			)
			.addExtraButton((button) => {
				button
					.setIcon("reset")
					.setTooltip("Restore default")
					.onClick(async () => {
						commandOption.outputType = DEFAULT_RECAP_OUTPUT_TYPE;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		outputSchemaSetting.descEl.createSpan({
			text: "The output schema must be a JSON schema object.",
		});
	}

	private renderApiTestMessage(apiTestMessageEl: HTMLElement) {
		if (this.plugin.settings.apiKey && this.plugin.settings.apiKeyTestedAt) {
			apiTestMessageEl.setText(
				`This key was tested at ${new Date(
					this.plugin.settings.apiKeyTestedAt,
				).toLocaleString()}.`,
			);
			return;
		}

		apiTestMessageEl.setText("");
	}
}

function formatError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
}
