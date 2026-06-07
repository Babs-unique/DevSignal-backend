import { analyzeWithGemini } from "./gemini.service.js";
import { analyzeWithOpenAI } from "./openai.service.js";

interface PromptData {
    resumeText: string;
    jobDescription: string;
    roleTitle: string;
    companyName: string;
    personalNotes: string;
}

//API CALLERS
const apiCallers = [
    { name: "Gemini", fn: analyzeWithGemini },
    { name: "OpenAI", fn: analyzeWithOpenAI }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeResume = async (data: PromptData) => {
    const MAX_RETRIES = 3;
    const INITIAL_DELAY_MS = 1000;

    for (const { name, fn } of apiCallers) {
        // Retry loop for the current provider
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`Calling ${name} (Attempt ${attempt}/${MAX_RETRIES})...`);
                return await fn(data); // Success! Breaks both loops and returns.
            } catch (error: any) {
                const isLastAttempt = attempt === MAX_RETRIES;
                
                console.error(`[${name}] Attempt ${attempt} failed: ${error.message || error}`);

                if (!isLastAttempt) {
                    // Exponential backoff delay (1s, 2s)
                    const backoffTime = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
                    console.log(`Waiting ${backoffTime}ms before retrying ${name}...`);
                    await delay(backoffTime);
                } else {
                    console.warn(`All attempts failed for ${name}. Falling back to next provider...`);
                }
            }
        }
    }

    // If both services completely exhaust all their retries
    throw new Error("All AI analysis providers failed after maximum retries.");
};
