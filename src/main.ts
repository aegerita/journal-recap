import { Plugin } from "obsidian";
import { registerSummarizeCommand } from "./commands/summarize";
import { ActiveNote } from "./obsidian/active-note";
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
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<JournalRecapSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
