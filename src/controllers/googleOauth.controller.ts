import { googleConfig} from '../config/google.js';
import { googleAccessToken, googleUser } from '../services/google.service.js';
import { userLoginOrRegister, refreshGoogleToken, logoutGoogleUser } from '../services/googleAuth.service.js';
import { Request, Response } from 'express';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce.js';
import { generateState, validateState, deleteState } from '../utils/state.js';
import { User } from '../models/users.model.js';
import jwt from 'jsonwebtoken';

export const initiateGoogleOAuth = (req: Request<{}, {} ,{} , { json?: boolean }>, res: Response) => {
    try {
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = generateCodeChallenge(codeVerifier);
        const state = generateState({
            codeVerifier, 
            codeChallenge
        });
        deleteState(state);
        const authUrl = `${googleConfig.authUrl}?client_id=${googleConfig.clientId}&redirect_uri=${encodeURIComponent(googleConfig.redirectUri)}&scope=openid%20email%20profile&response_type=code&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
        if(req.query.json === true || req.headers.accept?.includes('application/json')){
            return res.json({ 
                success: true,
                authUrl
            });
        }
        res.redirect(authUrl);
    } catch (error) {
        console.error('Error initiating Google OAuth:', error);
        res.status(500).json({ error: 'Failed to initiate Google OAuth' });
    }
};


export const handleGoogleOauthCallback = async (req: Request , res:Response ) => {
    const { code , state } = req.query;
    if(!code){
        return res.status(400).json({
            status: "error",
            success: false, 
            message: "Missing code parameter"
        });
    }   
    if(!state) {
        return res.status(400).json({
            status: "error",
            success: false,
            message: "Missing state parameter"
        });
    }
    const stateData = validateState(state as string);
    if(!stateData){
        return res.status(400).json({
            status: "error",
            success: false,
            message: "Invalid state parameter"
        });
    }
    const { codeVerifier , createdAt } = stateData;
    if(Date.now() - createdAt > 15 * 60 * 1000){ // State expires after 15 minutes
        deleteState(state as string);
        return res.status(400).json({
            status: "error",
            success: false,
            message: "State parameter has expired"
        });
    }
    try{
        const accessToken = await googleAccessToken(code as string, codeVerifier);
        const googleUserData = await googleUser(accessToken);
        const user = await userLoginOrRegister(googleUserData);
        deleteState(state as string);

        res.cookie('refreshToken', user.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.cookie('accessToken', user.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });
        return res.json({
            success: true,
            message: 'Authentication successful',
            data : {
                user: user.user,
            }
        });
    }catch(e){
        console.error('Error handling Google OAuth callback:', e);
        return res.status(500).json({
            status: 'error',
            success: false,
            message: 'Failed to authenticate with Google'
        });
    }
}

export const refreshAccessToken = async (req: Request, res: Response) => {
    const refreshTokenCookie = req.cookies.refreshToken;
    if (!refreshTokenCookie) {
        return res.status(401).json({
            status: "error",
            success: false,
            message: "Refresh token not found"
        });
    }
    // Implementation for refreshing Google token
    try {
        const result = await refreshGoogleToken(refreshTokenCookie);
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });
        return res.json({
            status: "success",
            success: true,
            message: "Google token refreshed successfully"
        });

    }catch(e){
        console.error('Error refreshing Google token:', e);
        
        // Handle JWT errors specifically
        if (e instanceof jwt.JsonWebTokenError) {
            if (e.name === 'TokenExpiredError') {
                return res.status(401).json({
                    status: "error",
                    success: false,
                    message: "Refresh token has expired. Please login again"
                });
            }
            return res.status(401).json({
                status: "error",
                success: false,
                message: "Invalid refresh token"
            });
        }
        
        return res.status(500).json({
            status: "error",
            success: false,
            message: "Failed to refresh Google token"
        })
    }
};


export const getGoogleUserProfile = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({
            status: "error",
            success: false,
            message: "User not authenticated"
        });
    }
    try {
        const user = await User.findById(userId).select('-password -refreshToken -__v');
        if (!user) {
            return res.status(404).json({
                status: "error",
                success: false,
                message: "User not found"
            });
        }
        return res.status(200).json({
            status: "success",
            success: true,
            data: {
                user
            }
        });
    }catch(e){
        console.error('Error fetching Google user profile:', e);
        return res.status(500).json({
            status: "error",
            success: false,             
            message: "Failed to fetch Google user profile"
        });
    }
};


export const logout = async (req: Request, res: Response) => {
    const refreshTokenCookie = req.cookies.refreshToken;
    if (!refreshTokenCookie) {
        return res.status(401).json({
            status: "error",
            success: false,
            message: "Refresh token not found"
        });
    }
    try{
        await logoutGoogleUser(refreshTokenCookie);
        res.clearCookie('refreshToken');
        res.clearCookie('accessToken');
        return res.json({
            status: "success",
            success: true,
            message: "Logged out successfully"
        });

    }catch(e){
        console.error('Error logging out Google user:', e);
        return res.status(500).json({
            status: "error",
            success: false,
            message: "Failed to log out Google user"
        });
    }
}