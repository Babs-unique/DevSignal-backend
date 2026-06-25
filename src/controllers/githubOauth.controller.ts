import { githubConfig } from '../config/github.js';
import { githubAccessToken, githubUser } from '../services/github.service.js';
import { User } from '../models/users.model.js';
import { generateAccessToken , generateRefreshToken , verifyAccessToken , verifyRefreshToken} from '../utils/jwt.js';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { generateState, validateState , deleteState } from '../utils/state.js';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce.js';
import { userLoginOrRegister, refreshGithubToken, logoutGithubUser } from '../services/githubAuth.service.js';
import { env } from '../config/env.js'



export const initiateGithubOAuth = (req: Request<{}, {} ,{} , { json?: string }>, res: Response) => {
    try {
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = generateCodeChallenge(codeVerifier);
        const state = generateState({
            codeVerifier, 
            codeChallenge
        })
        const authUrl = `${githubConfig.authUrl}?client_id=${githubConfig.clientId}&redirect_uri=${encodeURIComponent(githubConfig.redirectUri)}&scope=user:email&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
        if(req.query.json === 'true' || req.headers.accept?.includes('application/json')){
            return res.json({ 
                success: true,
                message : 'GitHub OAuth initiated successfully',
                authUrl,
                state,
            });
        }   
  /*       return res.status(200).json({
            status: true,
            message: 'Authorization url generated successfully',
            data:{
                authUrl
            }
        }) */
         res.redirect(authUrl); // Uncomment this line to redirect to Github OAuth
        } catch (e) {
        console.error('Error initiating GitHub OAuth:', e);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to initiate GitHub OAuth'
        });
    }
}
export const handleGithubOauthCallback = async (req: Request , res:Response ) => {
    const { code , state } = req.query;
    if(!code){
        return res.status(400).json({
            status: "error",
            success: false,
            message: "Missing code parameter"
        })
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
    const maxStateAge = 10 * 60 * 1000; // 10 minutes
    if(Date.now() - createdAt > maxStateAge){
        deleteState(state as string);
        return res.status(400).json({
            status: "error",
            success: false,
            message: "State parameter has expired"
        });
    }
    try{
        const accessToken = await githubAccessToken(code as string , codeVerifier);
        const githubUserData = await githubUser(accessToken);
        const authResult = await userLoginOrRegister(githubUserData);

        deleteState(state as string);

        res.cookie('refreshToken', authResult.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.cookie('accessToken', authResult.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });
/*         return res.status(200).json({
            status: 'success',
            message: 'GitHub OAuth successful',
            data: {
                user: authResult.user
            }
        }); */
            const clientUrl = env.CLIENT_URL || "http://localhost:5173";
            return res.redirect(`${clientUrl}/auth/callback`);

    }catch(e){
        console.error('Error handling GitHub OAuth callback:', e);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to handle GitHub OAuth callback'
        });
    }
}


export const refreshToken = async (req: Request, res: Response) => {
    const oldRefreshToken = req.cookies.refreshToken;
    if (!oldRefreshToken) {
        return res.status(401).json({
            status: 'error',
            message: 'No refresh token provided'
        });
    }
    try {
        const newTokens = await refreshGithubToken(oldRefreshToken);
        res.cookie('refreshToken', newTokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.cookie('accessToken', newTokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });
        return res.status(200).json({
            status: 'success',
            message: 'Tokens refreshed successfully'
        });
    } catch (e) {
        console.error('Error refreshing GitHub tokens:', e);
        
        // Handle JWT errors specifically
        if (e instanceof jwt.JsonWebTokenError) {
            if (e.name === 'TokenExpiredError') {
                return res.status(401).json({
                    status: 'error',
                    message: 'Refresh token has expired. Please login again'
                });
            }
            return res.status(401).json({
                status: 'error',
                message: 'Invalid refresh token'
            });
        }
        
        return res.status(500).json({
            status: 'error',
            message: 'Failed to refresh tokens'
        });
    }
};

export const getGithubUser = async (req: Request, res: Response) => {
    try{
        if(!req.user){
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            });
        }

        const user = await User.findById(req.user.userId).select('-password -refreshToken -__v');
        if(!user){
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        return res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });

    }catch(e){
        console.error('Error fetching GitHub user:', e);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch GitHub user data' 
        });
    }
};


/* export const logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({
            status: 'error',
            message: 'No refresh token provided'
        });
    }
    try {
        await logoutGithubUser(refreshToken);
        res.clearCookie('refreshToken');
        res.clearCookie('accessToken');
        return res.status(200).json({
            status: 'success',
            message: 'Logged out successfully'
        });
    } catch (e) {
        console.error('Error logging out:', e);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to log out'
        });
    }
};
 */
