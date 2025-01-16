import OpenAI from 'openai';
import { ResponseFormatJSONSchema } from 'openai/resources';
import { DEFAULT_OUTPUT_FORMAT } from './template';

export class ChatGPT {
    static async callAPI(
        system_role: string,
        user_input: string,
        response_format: ResponseFormatJSONSchema = DEFAULT_OUTPUT_FORMAT,
        apiKey: string,
        model: string = 'gpt-4o-mini',
        max_tokens: number = 2048,
        temperature: number = 1.15,
        top_p: number = 1,
        frequency_penalty: number = 0,
        presence_penalty: number = 1,
        baseURL?: string,
    ): Promise<string> {
        const client = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true, // Required for client-side use
            baseURL: baseURL || 'https://api.openai.com/v1'
        });

        try {
            const completion = await client.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: "system", content: [
                            { type: "text", text: system_role }
                        ]
                    },
                    {
                        role: "user", content: [
                            { type: "text", text: user_input }
                        ]
                    }
                ],
                response_format: response_format,
                temperature: temperature,
                max_completion_tokens: max_tokens,
                top_p: top_p,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty
            });

            return completion.choices[0].message.content || '';
        } catch (error) {
            if (error instanceof OpenAI.APIError) {
                throw new Error(`OpenAI API Error: ${error.status} - ${error.message}`);
            }
            throw error;
        }
    }
}
