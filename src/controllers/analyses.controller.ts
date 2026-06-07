import type { Request, Response } from 'express';
import { Analysis } from '../models/analysis.model.js';
import { extractResume } from '../utils/extractResume.js';
import { analyzeResume } from '../services/ai/ai.service.js';






export const newAnalyses = async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if(!userId){
        return res.status(401).json({
            status: 'error',
            success: false,
            message: 'User not authenticated'
        });
    }
    const file = req.file;

    if(!file){
        return res.status(400).json({
            status: 'error',
            success: false,
            message: 'No file uploaded'
        });
    }
    const { jobDescription, roleTitle, companyName, personalNotes } = req.body;

    if(!jobDescription || !roleTitle) {
        return res.status(400).json({
            status: 'error',
            success: false,
            message: 'Job description and role title are required'
        });
    }

    try {
        const resumeText = await extractResume(file.buffer, file.mimetype);

        if(!resumeText){
            return res.status(400).json({
                status: 'error',
                success: false,
                message: 'Failed to parse resume'
            });
        }

        const analysisResult =  await analyzeResume({
            resumeText,
            jobDescription,
            roleTitle,
            companyName: companyName || '',
            personalNotes: personalNotes || ''
        });

        const analysis = await Analysis.create({
            user: userId,
            roleTitle,
            companyName,
            resumeFileName: file.originalname,
            resumeText,
            jobDescription,
            matchScore: analysisResult.matchScore,
            analysisSummary: analysisResult.analysisSummary,
            existingSkills: analysisResult.existingSkills,
            missingSkills: analysisResult.missingSkills,
            recommendationActions: analysisResult.recommendationActions,
            keywordAnalysis: analysisResult.keywordAnalysis,
            resumeFeedback: analysisResult.resumeFeedback,
            radarChartData: analysisResult.radarChartData,
        });

        return res.status(201).json({
            status: 'success',
            success: true,
            data: {
                analysis
            }
        });
    } catch (e) {
        console.error('Error creating analysis:', e);
        return res.status(500).json({
            status: 'error',
            success: false,
            message: 'Server error'
        });
        
    }

}
