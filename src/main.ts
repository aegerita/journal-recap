import { Plugin } from "obsidian";
import { registerSummarizeCommand } from "./commands/summarize";
import { ActiveNote } from "./obsidian/active-note";
import { mergeSettings } from "./settings-data";
import {
	DEFAULT_SETTINGS,
	JournalRecapSettingTab,
	type JournalRecapSettings,
} from "./settings";

export default class JournalRecapPlugin extends Plugin {
	settings!: JournalRecapSettings;

	async onload() {
		await this.loadSettings();

		registerSummarizeCommand(this, new ActiveNote(this.app));

		this.addSettingTab(new JournalRecapSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = mergeSettings(DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
