import { PDFParse } from 'pdf-parse';
import { Request, Response } from 'express';
import { Analysis } from '../models/analysis.model.js';
import { extractResume} from '../utils/extractResume.js';





export const newAnalysis = ( req: Request, res : Response) =>{
    const { userId } = req.user;
    if(!userId){
        return res.status(401).json({
            status: 'error',
            success: false,
            message: 'User not authenticated'
        });
    }
    const pdf = req.file;
    const docx = req.file;

    if(!pdf || !docx){
        return res.status(400).json({
            status: 'error',
            success: false,
            message: 'No file uploaded'
        });
    }
    const { jobDescription, roleTitle , companyName , personalNotes} = req.body;
    if(!jobDescription) {
        return res.status(400).json({
            status: 'error',
            success: false,
            message: 'Job description is required'
        });
    }
    const parsedResume = extractResume(pdf.buffer , pdf.mimetype);
    if(!parsedResume){
        return res.status(400).json({
            status: 'error',
            success: false,
            message: 'Failed to parse resume'
        });
    }
    try {
        
    } catch (e) {
        console.error('Error creating analysis:', e);
        return res.status(500).json({
            status: 'error',
            success: false,
            message: 'Server error'
        });
        
    }

}