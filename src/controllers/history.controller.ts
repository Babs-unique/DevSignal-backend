import { Analysis } from "../models/analysis.model.js";
import type { Request, Response } from "express";

export const getHistoryMetric = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({
            status: "error",
            success: false,
            message: "User not authenticated",
        });
    }
    try {
        const analyses = await Analysis.find({ userId })
        .sort({ createdAt: -1 });

        const averageMatchScore = analyses.reduce((total, analysis) => total + analysis.matchScore, 0) / analyses.length;
        const topMatchedRole = Math.max(...analyses.map((analysis) => analysis.matchScore));
        const topMatchedRoleName = analyses.find((analysis) => analysis.matchScore === topMatchedRole)?.roleTitle;
        const totalAnalyses = analyses.length;
        return res.status(200).json({
            status: "success",
            success: true,
            data: {
                total: totalAnalyses,
                averageMatchScore: `${averageMatchScore.toFixed(2)}%`,
                topMatchedRole: topMatchedRole,
                topMatchedRoleName : topMatchedRoleName
            }
        });
    } catch (e) {
        console.error("Error fetching analyses:", e);
        return res.status(500).json({
            status: "error",
            success: false,
            message: "Failed to fetch analyses",
        });
    }
};

export const getHistory = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({
            status: "error",
            success: false,
            message: "User not authenticated",
        });
    }
    const 
    try {
        
    } catch (e) {
        console.error("Error fetching analyses:", e);
        return res.status(500).json({
            status: "error",
            success: false,
            message: "Failed to fetch analyses",
        });
    }
};