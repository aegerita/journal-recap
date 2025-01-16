# Journal Recap

`Journal Recap` is an [Obsidian](https://obsidian.md/) plugin that helps you to summarize your daily journal entries using OpenAI compatible LLM API. This plugin can analyze the content of your daily journal entries and generate a summary of the content. The summary include a list of key events and an one-sentence summary of the day. The summary is then plugged into the front matter of the daily journal entry.

## Original Project

This plugin is based on [Auto Classifier](https://github.com/HyeonseoNam/auto-classifier?tab=readme-ov-file) by [Hyeonseo Nam](https://github.com/HyeonseoNam).
The original work is licensed under the MIT License, which can be found in the [LICENSE file](https://github.com/HyeonseoNam/auto-classifier?tab=MIT-1-ov-file). 

## How to use

- Configure your API settings in the settings tab:
  - Enter your API key
  - Optionally set a custom base URL (useful for proxies or alternative API endpoints
  - Choose your preferred model
  - Test your configuration using the Test API call button
- (Optional) You can use your custom request for your selected API:
  - Custom Prompt Template
    - The LLM will respond based on this prompt.
  - Custom Response Schema
    - The plugin will parse the response based on this schema.
    - The schema should be a JSON object. The keys will be to insert the values into the front matter.

## Installation
- Search for `Journal Recap` in the Community plugin tab of the Obsidian settings.
- Alternatively, you can manually download the latest release from this repository's GitHub releases and extract the ZIP file to your Obsidian plugins folder.

## Support
If you encounter any issues while using this plugin or have suggestions for improvement, please feel free to submit an issue on the GitHub repository. Pull requests are also welcome.

## License
This project is distributed under the MIT License. See the [LICENSE](LICENSE) file for details.
