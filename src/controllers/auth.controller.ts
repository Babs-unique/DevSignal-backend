import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { User } from '../models/users.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, verifyAccessToken } from '../utils/jwt.js';

interface RegisterBody {
    email?: string;
    password?: string;
    confirmPassword?: string;
}

interface LoginBody{
    email?: string;
    password?: string;
}


export const register = async (req: Request<{}, any, RegisterBody>,
    res: Response) => {
    const { email, password , confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
        return res.status(400).json({
            status: 'error',
            message: 'Email, password and confirm password are required'
        })
    }

    if (password !== confirmPassword) {
        return res.status(400).json({
            status: 'error',
            message: 'Passwords do not match'
        })
    }

    try{
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email or password'
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            email,
            password: hashedPassword,
            name: email.split('@')[0] || 'User'
        });
        await user.save();

        const accessToken = generateAccessToken({ userId: user.id });
        const refreshToken = generateRefreshToken({ userId: user.id });

        return res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                accessToken,
                refreshToken,
            },
        });

    }catch(e){
        return res.status(500).json({
            status: 'error',
            message: 'Server error'
        }) 
    }
}
export const login = async (req:Request<{}, any, LoginBody>,
    res:Response) => {
    const {email, password} = req.body;
    if( !email || !password){
        return res.status(400).json({
            status: 'error',        
            message: 'Email and password are required'
        })
    }
    try{
        const user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email or password'
            })      
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email or password'
            })
        }

        const accessToken = generateAccessToken({ userId: user.id });
        const refreshToken = generateRefreshToken({ userId: user.id });

        return res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                accessToken,
                refreshToken,
            },
        });

    }catch(e){
        console.error('Login error', e);
        return res.status(500).json({
            status : 'error',
            message: 'Server error'
        })
    }

}

export const refreshToken = async (req: Request, res: Response) => {
    const refreshTokenCookie = req.cookies.refreshToken;
    if (!refreshTokenCookie) {
        return res.status(400).json({
            status: 'error',
            message: 'Refresh token is required'
        });
    }
    try {
        const verified = await verifyRefreshToken(refreshTokenCookie);
        if (!verified) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid refresh token'
            });
        }

        const user = await User.findOne({
            _id: verified.userId,
            refreshToken: refreshTokenCookie,
            isRevoked: false
        });

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid refresh token'
            });
        }

        // Revoke old token
        user.isRevoked = true;
        await user.save();

        // Generate new tokens
        const newAccessToken = generateAccessToken({ userId: user.id });
        const newRefreshToken = generateRefreshToken({ userId: user.id });

        // Update user with new refresh token
        const updatedUser = await User.findByIdAndUpdate(
            user.id,
            {
                refreshToken: newRefreshToken,
                isRevoked: false,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            },
            { new: true }
        );

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });

        return res.status(200).json({
            status: 'success',
            message: 'Tokens refreshed successfully',
            data: {
                accessToken: newAccessToken
            }
        });
    } catch (e) {
        console.error('Error refreshing token:', e);
        return res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

export const logout = async (req: Request, res: Response) => {
    const refreshTokenCookie = req.cookies.refreshToken;
    if (!refreshTokenCookie) {
        return res.status(401).json({
            status: 'error',
            message: 'No refresh token provided'
        });
    }
    try {
        const user = await User.findOne({
            refreshToken: refreshTokenCookie,
            isRevoked: false
        });

        if (user) {
            user.isRevoked = true;
            await user.save();
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

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


