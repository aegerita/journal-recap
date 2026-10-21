import { App, Notice, PluginSettingTab, Setting, requireApiVersion } from "obsidian";
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

const PRIVACY_NOTICE = "Summarizing sends this note's content, excluding frontmatter, to your configured endpoint. OpenAI requires an API account and may charge for requests. Your API key is stored in this vault's plugin data.";

interface SettingsRow {
	name: string;
	desc?: string;
	render(setting: Setting): void;
}

interface SettingsGroup {
	type: "group";
	heading: string;
	items: SettingsRow[];
}

export class JournalRecapSettingTab extends PluginSettingTab {
	plugin: JournalRecapPlugin;

	constructor(app: App, plugin: JournalRecapPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingsGroup[] {
		const commandOption = this.plugin.settings.commandOption;
		const connection: SettingsGroup = {
			type: "group",
			heading: "Connection",
			items: [
				{
					name: "Privacy and data",
					desc: PRIVACY_NOTICE,
					render: (setting) => {
						setting.settingEl.empty();
						setting.settingEl.createEl("p", {
							text: PRIVACY_NOTICE,
						});
					},
				},
				{
					name: "Model",
					desc: "Model identifier.",
					render: (setting) => {
						setting.addText((text) =>
							text.setValue(commandOption.model).onChange(async (value) => {
								commandOption.model = value.trim();
								await this.plugin.saveSettings();
							}),
						);
					},
				},
				{
					name: "Base endpoint",
					desc: "Use the default OpenAI endpoint or a compatible responses endpoint.",
					render: (setting) => {
						setting.addText((text) =>
							text
								.setPlaceholder(DEFAULT_SETTINGS.baseURL)
								.setValue(this.plugin.settings.baseURL)
								.onChange(async (value) => {
									this.plugin.settings.baseURL = value.trim() || DEFAULT_SETTINGS.baseURL;
									await this.plugin.saveSettings();
								}),
						);
					},
				},
				{
					name: "API key",
					desc: "Enter the API key for your configured endpoint.",
					render: (setting) => this.renderApiKeySetting(setting),
				},
			],
		};
		const advanced: SettingsGroup = {
			type: "group",
			heading: "Advanced",
			items: [{
				name: "Use custom request template",
				render: (setting) => {
					setting.addToggle((toggle) =>
						toggle
							.setValue(commandOption.useCustomCommand)
							.onChange(async (value) => {
								commandOption.useCustomCommand = value;
								await this.plugin.saveSettings();
								this.refreshSettings();
							}),
					);
				},
			}],
		};

		if (commandOption.useCustomCommand) {
			advanced.items.push(
				{
					name: "Custom prompt template",
					desc: "The model uses this as the system prompt.",
					render: (setting) => {
						setting
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
										this.refreshSettings();
									});
							});
					},
				},
				{
					name: "Custom output schema",
					desc: "The output schema must be a JSON schema object.",
					render: (setting) => {
						setting
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
										this.refreshSettings();
									});
							});
					},
				},
			);
		}

		return [connection, advanced];
	}

	display(): void {
		this.renderLegacySettings();
	}

	private renderLegacySettings(): void {
		this.containerEl.empty();
		for (const group of this.getSettingDefinitions()) {
			new Setting(this.containerEl).setName(group.heading).setHeading();
			for (const item of group.items) {
				const setting = new Setting(this.containerEl).setName(item.name);
				if (item.desc) setting.setDesc(item.desc);
				item.render(setting);
			}
		}
	}

	private refreshSettings(): void {
		if (requireApiVersion("1.13.0") && typeof this.update === "function") {
			this.update();
		} else {
			this.renderLegacySettings();
		}
	}

	private renderApiKeySetting(setting: Setting): void {
		setting.addText((text) => {
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
		const apiTestMessageEl = setting.descEl.createDiv();
		this.renderApiTestMessage(apiTestMessageEl);
		setting.addButton((button) => {
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
