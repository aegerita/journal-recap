import { App, PluginSettingTab, Setting } from "obsidian";
import { ChatGPT } from 'src/openai';
import type JournalRecapPlugin from "src/main";
import { DEFAULT_OUTPUT_FORMAT, DEFAULT_SYSTEM_MESSAGE } from "./template";
import { ResponseFormatJSONSchema } from "openai/resources";

// for tag, keyword
export interface CommandOption {
    key: string;

    useCustomCommand: boolean;

    system_prompt: string;
    response_schema: ResponseFormatJSONSchema;
    model: string;
}


export class JournalRecapSettings {
    apiKey: string;
    apiKeyCreatedAt: Date | null;
    baseURL: string;
    commandOption: CommandOption;
}

export const DEFAULT_SETTINGS: JournalRecapSettings = {
    apiKey: '',
    apiKeyCreatedAt: null,
    baseURL: 'https://api.openai.com/v1',
    commandOption: {
        key: 'tags',
        useCustomCommand: false,

        system_prompt: DEFAULT_SYSTEM_MESSAGE,
        response_schema: DEFAULT_OUTPUT_FORMAT,

        model: "gpt-4o-mini",
    },
};

export class JournalRecapSettingTab extends PluginSettingTab {
    plugin: JournalRecapPlugin;
    constructor(app: App, plugin: JournalRecapPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async display(): Promise<void> {

        const { containerEl } = this;
        const commandOption = this.plugin.settings.commandOption;

        containerEl.empty();
        // shortcut button
        const shortcutEl = new Setting(this.containerEl)
            .setDesc('')
            .addButton((cb) => {
                cb.setButtonText("Specify shortcuts")
                    .setCta()
                    .onClick(() => {
                        // @ts-ignore
                        app.setting.openTabById("hotkeys");
                        // @ts-ignore
                        const tab = app.setting.activeTab;
                        tab.setQuery(this.plugin.manifest.id);
                        tab.updateHotkeyVisibility();
                    });
            });
        shortcutEl.descEl.createSpan({ text: 'This plugin does not have default shortcuts to prevent shortcut conflicts.' });
        shortcutEl.descEl.createEl('br');
        shortcutEl.descEl.createSpan({ text: 'Assign your own shortcuts to run commands for different input types.' });


        // ------- [API Setting] -------
        // API Key input
        containerEl.createEl('h1', { text: 'API Setting' });

        new Setting(containerEl)
            .setName('Custom Model')
            .setDesc("ID of the model to use. See https://platform.openai.com/docs/models")
            .addText((text) =>
                text
                    .setPlaceholder('gpt-4o-mini')
                    .setValue(commandOption.model)
                    .onChange(async (value) => {
                        commandOption.model = value;
                        await this.plugin.saveSettings();
                    })
            );

        const apiKeySetting = new Setting(containerEl)
            .setName('ChatGPT API Key')
            .setDesc('')
            .addText((text) =>
                text
                    .setPlaceholder('API key')
                    .setValue(this.plugin.settings.apiKey)
                    .onChange((value) => {
                        this.plugin.settings.apiKey = value;
                        this.plugin.saveSettings();
                    })
            )
        // API Key Description & Message
        apiKeySetting.descEl.createSpan({ text: 'Enter your ChatGPT API key. If you don\'t have one yet, you can create it at ' });
        apiKeySetting.descEl.createEl('a', { href: 'https://platform.openai.com/account/api-keys', text: 'here' })
        const apiTestMessageEl = document.createElement('div');
        apiKeySetting.descEl.appendChild(apiTestMessageEl);

        //API Key default message
        if (this.plugin.settings.apiKey && this.plugin.settings.apiKeyCreatedAt) {
            apiTestMessageEl.setText(`This key was tested at ${this.plugin.settings.apiKeyCreatedAt.toString()}`);
            apiTestMessageEl.style.color = 'var(--success-color)';
        }

        // API Key test button
        apiKeySetting.addButton((cb) => {
            cb.setButtonText('Test API call')
                .setCta()
                .onClick(async () => {
                    this.plugin.settings.apiKeyCreatedAt
                    apiTestMessageEl.setText('Testing api call...');
                    apiTestMessageEl.style.color = 'var(--text-normal)';
                    try {
                        await ChatGPT.callAPI('', 'test', undefined, this.plugin.settings.apiKey, this.plugin.settings.commandOption.model, undefined, undefined, undefined, undefined, undefined, this.plugin.settings.baseURL);
                        apiTestMessageEl.setText('Success! API working.');
                        apiTestMessageEl.style.color = 'var(--success-color)';
                        this.plugin.settings.apiKeyCreatedAt = new Date();
                    } catch (error) {
                        apiTestMessageEl.setText('Error: API is not working.');
                        apiTestMessageEl.style.color = 'var(--warning-color)';
                        this.plugin.settings.apiKeyCreatedAt = null;
                    }
                });
        });

        // ------- [Advanced Setting] -------
        containerEl.createEl('h1', { text: 'Advanced Setting' });

        // Toggle custom rule
        new Setting(containerEl)
            .setName('Use Custom Request Template')
            .addToggle((toggle) =>
                toggle
                    .setValue(commandOption.useCustomCommand)
                    .onChange(async (value) => {
                        commandOption.useCustomCommand = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }),
            );

        // Custom template textarea
        if (commandOption.useCustomCommand) {
            const customPromptTemplateEl = new Setting(containerEl)
                .setName('Custom Prompt Template')
                .setDesc('')
                .setClass('setting-item-child')
                .setClass('block-control-item')
                .setClass('height20-text-area')
                .addTextArea((text) =>
                    text
                        .setPlaceholder('Write custom prompt template.')
                        .setValue(commandOption.system_prompt)
                        .onChange(async (value) => {
                            commandOption.system_prompt = value;
                            await this.plugin.saveSettings();
                        })
                )
                .addExtraButton(cb => {
                    cb
                        .setIcon('reset')
                        .setTooltip('Restore to default')
                        .onClick(async () => {
                            commandOption.system_prompt = DEFAULT_SYSTEM_MESSAGE;

                            await this.plugin.saveSettings();
                            this.display();
                        })
                });
            customPromptTemplateEl.descEl.createSpan({ text: 'This plugin is based on the ChatGPT answer.' });
            customPromptTemplateEl.descEl.createEl('br');
            customPromptTemplateEl.descEl.createSpan({ text: 'You can use your own template when making a request to ChatGPT.' });
            customPromptTemplateEl.descEl.createEl('br');
            customPromptTemplateEl.descEl.createSpan({ text: 'Use ' });
            customPromptTemplateEl.descEl.createEl('a', { href: 'https://platform.openai.com/playground/chat?lang=node.js&models=gpt-4o-mini', text: 'ChatGPT Playground' })
            customPromptTemplateEl.descEl.createSpan({ text: ' to test your prompt.' });
            customPromptTemplateEl.descEl.createEl('br');
            customPromptTemplateEl.descEl.createEl('br');

            const customChatRoleEl = new Setting(containerEl)
                .setName('Custom Output Format')
                .setDesc('')
                .setClass('setting-item-child')
                .setClass('block-control-item')
                .setClass('height20-text-area')
                .addTextArea((text) =>
                    text
                        .setPlaceholder('Write custom output format for gpt system.')
                        .setValue(JSON.stringify(commandOption.response_schema, null, 2))
                        .onChange(async (value) => {
                            commandOption.response_schema = JSON.parse(value);
                            await this.plugin.saveSettings();
                        })
                )
                .addExtraButton(cb => {
                    cb
                        .setIcon('reset')
                        .setTooltip('Restore to default')
                        .onClick(async () => {
                            commandOption.response_schema = DEFAULT_OUTPUT_FORMAT;
                            await this.plugin.saveSettings();
                            this.display();
                        })
                });
            customChatRoleEl.descEl.createSpan({ text: 'Define output format to ChatGPT system.' });
        }
    }
}