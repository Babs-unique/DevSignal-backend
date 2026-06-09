import { Analysis } from '../models/analysis.model.js';
import type {Request, Response} from 'express';




export const getDashboard = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if(!userId){
        return res.status(401).json({
            status: 'error',
            success: false,
            message: 'User not authenticated'
        });
    }
    try {
        const analyses = await Analysis.find({ userId , isDeleted:false})
        .sort({ createdAt: -1 })
        .limit(3)

        const latestMetric = analyses[0] || null;
        return res.status(200).json({
            status: 'success',
            success: true,
            data: {
                latestMetric : latestMetric,
                analyses
            }
        })
    } catch (e) {
        console.error('Error fetching analyses:', e);
        return res.status(500).json({
            status: 'error',
            success: false,
            message: 'Failed to fetch analyses'
        })
    }
}

export const getLatestAnalysesById = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if(!userId){
        return res.status(401).json({
            status: 'error',
            success: false,
            message: 'User not authenticated'
        });
    }
    const { id } = req.params;
    if(!id){
        return res.status(400).json({
            status: 'error',
            success: false,
            message: 'Analysis id is required'
        });
    }
    try {
        const analyses = await Analysis.find({ userId, _id: id , isDeleted:false})
        return res.status(200).json({
            status: 'success',
            success: true,
            data: {
                analyses
            }
        })
    } catch (e) {
        console.error('Error fetching analyses:', e);
        return res.status(500).json({
            status: 'error',
            success: false,
            message: 'Failed to fetch analyses'
        })
    }
}