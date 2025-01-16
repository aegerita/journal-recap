import { ResponseFormatJSONSchema } from "openai/resources";

export const DEFAULT_SYSTEM_MESSAGE = `Create summary for a journal entry

Your summary should match the tone of the provided content, be super cute, adding emoji to express emotions, and use more casual language because I am just such an awesome and unique individual that needs this sparkle ✨
First summarize the events that happened during the day. Each event should be from around 5 words with emoji at the end. Do not have more than 5 events, yet keep ideas from all major paragraphs.
Then, in one line, summarize the general gist of personal learnings and feelings of the day. 
重复使用input所用的措辞和语言，不要啰嗦
`;

export const DEFAULT_OUTPUT_FORMAT: ResponseFormatJSONSchema = {
    "type": "json_schema",
    "json_schema": {
        "name": "summary",
        "strict": true,
        "schema": {
            "type": "object",
            "properties": {
                "events": {
                    "type": "array",
                    "description": "list of events",
                    "items": {
                        "type": "string"
                    }
                },
                "summary": {
                    "type": "string",
                    "description": "in 20 words"
                }
            },
            "required": [
                "events",
                "summary"
            ],
            "additionalProperties": false
        }
    }
};