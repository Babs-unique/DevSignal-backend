import OpenAI from 'openai'
import { env } from '../../config/env.js'
import { buildPrompt } from '../../prompts/prompts.js'

interface PromptData {
    resumeText: string;
    jobDescription: string;
    roleTitle: string;
    companyName: string;
    personalNotes: string;
}

const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
})

export const analyzeWithOpenAI = async ( data: PromptData ) => {
    const prompt = buildPrompt(data);

    const response = await (client.chat.completions.create as any)({
        model: "gpt-5.5",
        max_tokens: 2048,
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        response_format: {
            type: "json_object",
        }
    });
    const result = response?.choices[0]?.message?.content || '';
    if(!result){
        throw new Error('No response from OpenAI');
    }
    return JSON.parse(result);
    
}