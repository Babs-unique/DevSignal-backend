import { analyzeWithGemini } from "./gemini.service.js";
import { analyzeWithOpenAI } from "./openai.service.js";

interface PromptData {
    resumeText: string;
    jobDescription: string;
    roleTitle: string;
    companyName: string;
    personalNotes: string;
}

export const analyzeResume = async (data: PromptData) => {
    try {
        console.log('Analyzing Data')
        return await analyzeWithGemini(data);
    } catch (e) {
        
    }
}