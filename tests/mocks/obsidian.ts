export const state = {
	contentStart: 0,
	parsedContent: "",
	requests: [] as Record<string, unknown>[],
	response: { status: 200, text: "" },
	notices: [] as string[],
	settings: [] as Setting[],
	supportsSettingsDefinitions: false,
};

export class MarkdownView {}

export function requireApiVersion(_version: string) {
	return state.supportsSettingsDefinitions;
}

export function getFrontMatterInfo(content: string) {
	state.parsedContent = content;
	return { contentStart: state.contentStart };
}

export async function requestUrl(options: Record<string, unknown>) {
	state.requests.push(options);
	return state.response;
}

export class Notice {
	constructor(message: string) {
		state.notices.push(message);
	}
	hide() {}
}

export class MockElement {
	children: MockElement[] = [];
	text = "";
	tag = "div";
	clearCount = 0;

	empty() {
		this.children = [];
		this.clearCount++;
	}

	createEl(tag: string, options: { text?: string } = {}) {
		const element = new MockElement();
		element.tag = tag;
		element.text = options.text ?? "";
		this.children.push(element);
		return element;
	}

	createSpan(options: { text?: string } = {}) {
		return this.createEl("span", options);
	}

	createDiv() {
		return this.createEl("div");
	}

	setText(text: string) {
		this.text = text;
	}
}

export class PluginSettingTab {
	containerEl = new MockElement();
	constructor(public app: unknown, _plugin: unknown) {}
}

class MockInput {
	inputEl = { type: "text" };
	value: string | boolean = "";
	onChangeCallback?: (value: string | boolean) => Promise<void>;

	setValue(value: string | boolean) {
		this.value = value;
		return this;
	}

	setPlaceholder(_value: string) {
		return this;
	}

	onChange(callback: (value: string | boolean) => Promise<void>) {
		this.onChangeCallback = callback;
		return this;
	}
}

class MockButton {
	label = "";
	onClickCallback?: () => Promise<void>;

	setButtonText(text: string) {
		this.label = text;
		return this;
	}

	setCta() { return this; }
	setIcon(_icon: string) { return this; }
	setTooltip(_text: string) { return this; }
	onClick(callback: () => Promise<void>) {
		this.onClickCallback = callback;
		return this;
	}
}

export class Setting {
	name = "";
	heading = false;
	settingEl: MockElement;
	descEl: MockElement;
	inputs: MockInput[] = [];
	buttons: MockButton[] = [];

	constructor(containerEl: MockElement) {
		this.settingEl = containerEl.createDiv();
		this.descEl = this.settingEl.createDiv();
		state.settings.push(this);
	}

	setName(name: string) {
		this.name = name;
		return this;
	}

	setDesc(desc: string) {
		this.descEl.setText(desc);
		return this;
	}

	setHeading() {
		this.heading = true;
		return this;
	}

	setClass(_className: string) { return this; }

	addText(callback: (input: MockInput) => unknown) {
		const input = new MockInput();
		this.inputs.push(input);
		callback(input);
		return this;
	}

	addTextArea(callback: (input: MockInput) => unknown) { return this.addText(callback); }
	addToggle(callback: (input: MockInput) => unknown) { return this.addText(callback); }

	addButton(callback: (button: MockButton) => unknown) {
		const button = new MockButton();
		this.buttons.push(button);
		callback(button);
		return this;
	}

	addExtraButton(callback: (button: MockButton) => unknown) { return this.addButton(callback); }
}
