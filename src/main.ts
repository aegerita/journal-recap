import { Plugin, Notice } from "obsidian";
import {
	JournalRecapSettingTab,
	JournalRecapSettings,
	DEFAULT_SETTINGS,
} from "./settings";
import { ViewManager } from "./view-manager";
import { ChatGPT } from "./openai";


export default class JournalRecapPlugin extends Plugin {
	settings: JournalRecapSettings;
	viewManager = new ViewManager(this.app);

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "classify-tag-content",
			name: "Classify tag from Note Content",
			callback: async () => {
				await this.runSummarize();
			},
		});

		this.addSettingTab(new JournalRecapSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onunload() {}

	// create loading spin in the Notice message
	createLoadingNotice(text: string, number = 10000): Notice {
		const notice = new Notice("", number);
		const loadingContainer = document.createElement("div");
		loadingContainer.addClass("loading-container");

		const loadingIcon = document.createElement("div");
		loadingIcon.addClass("loading-icon");
		const loadingText = document.createElement("span");
		loadingText.textContent = text;
		//@ts-ignore
		notice.noticeEl.empty();
		loadingContainer.appendChild(loadingIcon);
		loadingContainer.appendChild(loadingText);
		//@ts-ignore
		notice.noticeEl.appendChild(loadingContainer);

		return notice;
	}

	async runSummarize() {
		const loadingNotice = this.createLoadingNotice(`${this.manifest.name}: Processing..`);
		try {
			await this.summarize();
			loadingNotice.hide();
		} catch (err) {
			loadingNotice.hide();
		}
	}

	async summarize() {
		const commandOption = this.settings.commandOption;
		// ------- [API Key check] -------
		if (!this.settings.apiKey) {
			new Notice(`⛔ ${this.manifest.name}: You shuld input your API Key`);
			return null;
		}
		// ------- [Input] -------
		// Set Input
		let input: string | null = "";
		input = await this.viewManager.getContent();

		// input error
		if (!input) {
			new Notice(`⛔ ${this.manifest.name}: no input data`);
			return null;
		}

		let user_input = input;
		const system_role = this.settings.commandOption.system_prompt;

		// ------- [API Processing] -------
		// Call API
		const responseRaw = await ChatGPT.callAPI(
			system_role,
			user_input,
			this.settings.commandOption.response_schema,
			this.settings.apiKey,
			this.settings.commandOption.model,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			this.settings.baseURL,
		);
		try {
			try {
				const response = JSON.parse(responseRaw);

				for (const key in response) {
					this.viewManager.insertAtFrontMatter(
						key,
						response[key],
					);
				}

				new Notice(`✅ ${this.manifest.name}: summarized`);
			} catch (error) {
				new Notice(`⛔ ${this.manifest.name}: JSON parsing error - ${error}`);
				return null;
			}
		} catch (error) {
			new Notice(`⛔ ${this.manifest.name}: ${error}`);
			return null;
		}
	}
}