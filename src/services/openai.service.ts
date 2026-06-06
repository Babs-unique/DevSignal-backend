import openAI from 'openai'
import { env } from '../config/env.js'
import { buildPrompt } from '../prompts/prompts.js'

interface PromptData {
    resumeText: string;
    jobDescription: string;
    roleTitle: string;
    companyName: string;
    personalNotes: string;
}
const client = new openAI({
    apiKey: env.OPEN_API_KEY,
})

 export const analyseResume = ( data: PromptData ) =>{
    const prompt = buildPrompt(data);

    const response = client.responses.create({
        model: "gpt-5",
        input : prompt,
        text : {
            format : {
                type: 'json_object',
            }
        }
    });
    return JSON.parse(response.output_text);
    
}