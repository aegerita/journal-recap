import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import type { App } from "obsidian";
import type JournalRecapPlugin from "../src/main";
import { DEFAULT_SETTINGS, JournalRecapSettingTab } from "../src/settings";
import { MockElement, Setting, state } from "./mocks/obsidian";

function createTab() {
	let saves = 0;
	const plugin = {
		settings: structuredClone(DEFAULT_SETTINGS),
		saveSettings: async () => { saves++; },
	} as unknown as JournalRecapPlugin;
	return { plugin, tab: new JournalRecapSettingTab({} as App, plugin), saves: () => saves };
}

beforeEach(() => {
	state.settings.length = 0;
	state.requests.length = 0;
	state.supportsSettingsDefinitions = false;
});

test("modern definitions expose core and custom settings to search", () => {
	const { tab, plugin } = createTab();
	let groups = tab.getSettingDefinitions();
	assert.deepEqual(groups.map((group) => group.heading), ["Connection", "Advanced"]);
	assert.deepEqual(groups.flatMap((group) => group.items.map((row) => row.name)), [
		"Privacy and data", "Model", "Base endpoint", "API key", "Use custom request template",
	]);
	plugin.settings.commandOption.useCustomCommand = true;
	groups = tab.getSettingDefinitions();
	assert.deepEqual(groups[1]!.items.map((row) => row.name), [
		"Use custom request template", "Custom prompt template", "Custom output schema",
	]);
	assert.equal(groups[0]!.items[1]!.desc, "Model identifier.");
	assert.equal(state.requests.length, 0);
});

test("modern renderers retain password masking and the privacy paragraph", () => {
	const { tab } = createTab();
	const rows = tab.getSettingDefinitions()[0]!.items;
	for (const row of rows) {
		const setting = new Setting(new MockElement());
		row.render(setting as never);
	}
	assert.equal(state.settings[3]!.inputs[0]!.inputEl.type, "password");
	assert.equal(state.settings[3]!.buttons[0]!.label, "Test API call");
	const paragraph = state.settings[0]!.settingEl.children[0]!;
	assert.equal(paragraph.tag, "p");
	assert.match(paragraph.text, /excluding frontmatter/);
	assert.equal(state.requests.length, 0);
});

test("legacy display and refresh work when update is unavailable", async () => {
	const { tab, plugin, saves } = createTab();
	assert.equal(typeof tab.update, "undefined");
	tab.display();
	assert.deepEqual(state.settings.filter((row) => row.heading).map((row) => row.name), ["Connection", "Advanced"]);
	const toggle = state.settings.find((row) => row.name === "Use custom request template")!;
	await toggle.inputs[0]!.onChangeCallback!(true);
	assert.equal(plugin.settings.commandOption.useCustomCommand, true);
	assert.equal(saves(), 1);
	assert.ok(state.settings.some((row) => row.name === "Custom prompt template"));
	assert.equal((tab.containerEl as unknown as MockElement).clearCount, 2);
	assert.equal(state.requests.length, 0);
});

test("modern changes refresh through update instead of the legacy renderer", async () => {
	const { tab, plugin, saves } = createTab();
	state.supportsSettingsDefinitions = true;
	let updates = 0;
	tab.update = () => { updates++; };
	const row = tab.getSettingDefinitions()[1]!.items[0]!;
	const setting = new Setting(new MockElement());
	row.render(setting as never);
	await setting.inputs[0]!.onChangeCallback!(true);
	assert.equal(updates, 1);
	assert.equal(plugin.settings.commandOption.useCustomCommand, true);
	assert.equal(saves(), 1);
	assert.equal((tab.containerEl as unknown as MockElement).clearCount, 0);
	assert.equal(state.requests.length, 0);
});
