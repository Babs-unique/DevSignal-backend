import { verifyAccessToken } from '../utils/jwt.js';
import type { NextFunction, Request, Response } from 'express';


const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};



export { authMiddleware as authenticate };
