import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../../config/env.js';
import { buildPrompt } from '../../prompts/prompts.js';

interface PromptData {
    resumeText: string;
    jobDescription: string;
    roleTitle: string;
    companyName: string;
    personalNotes: string;
}

export interface ExistingSkill {
    skill: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    confidence: number;
    category: string;
}

export interface MissingSkill {
    skill: string;
    importance: 'Nice to Have' | 'Recommended' | 'Important' | 'Critical';
    category: string;
    reason: string;
}

export interface RecommendationAction {
    title: string;
    description: string;
    category: string;
    difficulty: string;
    estimatedTime: string;
    careerImpact: 'Low Impact' | 'Medium Impact' | 'High Impact' | 'Very High Impact';
}

export interface RadarChartItem {
    skill: string;
    userScore: number;
    marketExpectedScore: number;
}

export interface AnalysisResult {
    matchScore: number;
    analysisSummary: {
        overallAssessment: string;
        marketReadiness: string;
        hiringLikelihood: string;
    };
    existingSkills: ExistingSkill[];
    missingSkills: MissingSkill[];
    recommendationActions: RecommendationAction[];
    keywordAnalysis: {
        matchedKeywords: string[];
        missingKeywords: string[];
    };
    resumeFeedback: {
        strengths: string[];
        weaknesses: string[];
    };
    radarChartData: RadarChartItem[];
}

const client = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
});

export const analyzeWithGemini = async (data: PromptData): Promise<AnalysisResult> => {
    const prompt = buildPrompt(data);

    const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            temperature:0.1,
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    matchScore: { type: Type.NUMBER },
                    analysisSummary: {
                        type: Type.OBJECT,
                        properties: {
                            overallAssessment: { type: Type.STRING },
                            marketReadiness: { type: Type.STRING },
                            hiringLikelihood: { type: Type.STRING }
                        },
                        required: ["overallAssessment", "marketReadiness", "hiringLikelihood"]
                    },
                    existingSkills: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                skill: { type: Type.STRING },
                                level: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
                                confidence: { type: Type.NUMBER },
                                category: { type: Type.STRING }
                            },
                            required: ["skill", "level", "confidence", "category"]
                        }
                    },
                    missingSkills: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                skill: { type: Type.STRING },
                                importance: { type: Type.STRING, enum: ["Nice to Have", "Recommended", "Important", "Critical"] },
                                category: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            },
                            required: ["skill", "importance", "category", "reason"]
                        }
                    },
                    recommendationActions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                category: { type: Type.STRING },
                                difficulty: { type: Type.STRING },
                                estimatedTime: { type: Type.STRING },
                                careerImpact: { type: Type.STRING, enum: ["Low Impact", "Medium Impact", "High Impact", "Very High Impact"] }
                            },
                            required: ["title", "description", "category", "difficulty", "estimatedTime", "careerImpact"]
                        }
                    },
                    keywordAnalysis: {
                        type: Type.OBJECT,
                        properties: {
                            matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["matchedKeywords", "missingKeywords"]
                    },
                    resumeFeedback: {
                        type: Type.OBJECT,
                        properties: {
                            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["strengths", "weaknesses"]
                    },
                    radarChartData: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                skill: { type: Type.STRING },
                                userScore: { type: Type.NUMBER },
                                marketExpectedScore: { type: Type.NUMBER }
                            },
                            required: ["skill", "userScore", "marketExpectedScore"]
                        }
                    }
                },
                required: [
                    "matchScore", 
                    "analysisSummary", 
                    "existingSkills", 
                    "missingSkills", 
                    "recommendationActions", 
                    "keywordAnalysis", 
                    "resumeFeedback", 
                    "radarChartData"
                ]
            }
        }
    });

    const result = response?.text || '';
    if (!result) {
        throw new Error('No response from Gemini');
    }
    try {
        return JSON.parse(result) as AnalysisResult;
    } catch (error) {
        console.error('Error parsing Gemini response:', error);
        throw new Error('Failed to parse Gemini response');
    }
};
