import { Analysis } from "../models/analysis.model.js";
import type { Request, Response } from "express";
import { getDateRange } from "../utils/dateRange.js";



interface SearchQuery{
    q?:string,
    score?:string,
    date?:string
}
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10 ;
    const startIndex = (page - 1) * limit;
    try {
        const analyses = await Analysis.find({ userId })
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);

        return res.status(200).json({
            status: "success",
            success: true,
            data: {
                analyses,
            },
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

export const searchHistory = async (req: Request<
    {},{},{}, SearchQuery
    >,
    res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({
            status: "error",
            success: false,
            message: "User not authenticated",
        });
    }
    const { q } = req.query;
    const date = parseInt(req.query.date as string) || 30;
    const score = parseInt(req.query.score as string) || 50;
    const dateRange = getDateRange(date);

    if(!q){
        return res.status(400).json({
            status: "error",
            success: false,
            message: "Query is required"
        });
    }
    const formattedQuery = (text:string):string => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const configuredQuery = formattedQuery(q);
    try {
        const analyses = await Analysis.find({ 
            $or: [
                { roleTitle: { $regex: configuredQuery, $options: "i" } },
                { companyName: { $regex: configuredQuery, $options: "i" } },
            ],
            matchScore: { $gte: score },
            createdAt: { $gte: dateRange},
            userId
        });

        if(analyses.length === 0){
            return res.status(200).json({
                status: "success",
                success: true,
                data: {
                    analyses: [],
                },
                message: "No results found"
            });
        }
        return res.status(200).json({
            status: "success",
            success: true,
            data: {
                analyses,
            },
        });
    } catch (e) {
        console.error("Error fetching analyses:", e);
        return res.status(500).json({
            status: "error",
            success: false,
            message: "Failed to fetch analyses",
        });
    }
}