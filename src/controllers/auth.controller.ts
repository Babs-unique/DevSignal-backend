import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { User } from '../models/users.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, verifyAccessToken } from '../utils/jwt.js';
import { sendPasswordResetEmail } from '../services/email.service.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { validateTurnstile } from '../utils/cloudFlare.js';

interface RegisterBody {
    email?: string;
    password?: string;
    confirmPassword?: string;
    token?: string
}

interface LoginBody{
    email?: string;
    password?: string;
    token?: string
}

const getNameFromEmailNoNumbers = (email: string) => {
    const localPart = email.split('@')[0] ?? '';
    const cleaned = localPart
        .replace(/[._-]+/g, ' ')
        .trim()
        .split(' ')
        .map((segment) => segment
            .trim()
            .replace(/[^\p{L}]/gu, '')
            .toLowerCase()
        )
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1));

    return cleaned.length > 0 ? cleaned.join(' ') : 'User';
}

export const register = async (req: Request<{}, any, RegisterBody>,
    res: Response) => {
    const { email, password , confirmPassword, token } = req.body;

    if (!email || !password || !confirmPassword || !token) {
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
    const isTurnstileValid = await validateTurnstile(token , req.ip);
    if (!isTurnstileValid) {
        return res.status(400).json({
            status: 'error',
            message: 'reCaptcha failed '
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
            name: getNameFromEmailNoNumbers(email)
        });
        await user.save();

        const accessToken = generateAccessToken({ userId: user.id });
        const refreshToken = generateRefreshToken({ userId: user.id });

        // Save refresh token to database
        user.refreshToken = refreshToken;
        user.isRevoked = false;
        user.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await user.save();

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
    const {email, password , token} = req.body;
    if( !email || !password || !token){
        return res.status(400).json({
            status: 'error',        
            message: 'Email and password are required'
        })
    }
    const isTurnstileValid = await validateTurnstile(token , req.ip);
    if (!isTurnstileValid) {
        return res.status(400).json({
            status: 'error',
            message: 'reCaptcha failed '
        })
    }
    try{
        const user = await User.findOne({ email, isDeleted: false });
        if(!user){
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email or password'
            })      
        }
        if (!user.password) {
            return res.status(400).json({
                status: 'error',
                message: 'Account associated with Google or Github '
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

        // Save refresh token to database
        user.refreshToken = refreshToken;
        user.isRevoked = false;
        user.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await user.save();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000
        });

        return res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                }
            },
        });

    }catch(e){
        console.error('Login error', e);
        
        // Handle JWT errors specifically
        if (e instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid authentication token'
            });
        }
        
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
            isRevoked: false,
            isDeleted: false
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
            { returnDocument: 'after' }
        );

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
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

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({
            status: 'error',
            message: 'Email is required'
        });
    }

    try {
        const user = await User.findOne({ email, isDeleted: false });
        if (!user) {
            // Don't reveal if user exists for security reasons
            return res.status(200).json({
                status: 'success',
                message: 'If an account exists with this email, a reset link has been sent'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save reset token to user
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();

        // Send email
        await sendPasswordResetEmail(email, resetToken);

        return res.status(200).json({
            status: 'success',
            message: 'If an account exists with this email, a reset link has been sent'
        });
    } catch (e) {
        console.error('Forgot password error:', e);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to process forgot password request'
        });
    }
};

interface ResetPasswordBody {
    token?: string;
    newPassword?: string;
    confirmPassword?: string;
}

export const resetPassword = async (req: Request<{}, any, ResetPasswordBody>, res: Response) => {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({
            status: 'error',
            message: 'Token, new password, and confirm password are required'
        });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            status: 'error',
            message: 'Passwords do not match'
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            status: 'error',
            message: 'Password must be at least 6 characters'
        });
    }

    try {
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() }
        });

        if (!user) {
            await bcrypt.hash(newPassword, 10);
            return res.status(400).json({
                status: 'error',
                message: 'Invalid or expired reset token'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password and clear reset token
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
       /*  await user.save(); */
        await user.updateOne({
            $set: {password : hashedPassword},
            $unset:{resetToken: 1 , resetTokenExpiry: 1}
        })

        return res.status(200).json({
            status: 'success',
            message: 'Password reset successful. You can now login with your new password'
        });
    } catch (e) {
        console.error('Reset password error:', e);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to reset password'
        });
    }
};

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            });
        }

        const user = await User.findOne({
            _id: req.user.userId,
            isDeleted: false
        }).select('-password -refreshToken -resetToken -resetTokenExpiry');

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        return res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    githubId: user.githubId,
                    googleId: user.googleId,
                    avatarUrl: user.avatarUrl,
                    createdAt: user.createdAt
                }
            }
        });
    } catch (e) {
        console.error('Error fetching current user:', e);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch user information'
        });
    }
};


export const deleteAccount = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized'
        });
    }

    try {
        const user = await User.findById(userId);
        if (!user || user.isDeleted) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found or already deleted'
            });
        }

        const deletionRequestedAt = new Date();
        const deletionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        user.isDeleted = true;
        user.deletionRequestedAt = deletionRequestedAt;
        user.deletionExpiresAt = deletionExpiresAt;
        user.deletionPeriod = 30;
        user.refreshToken = undefined;
        user.isRevoked = true;
        user.expiresAt = undefined;
        await user.save();

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });

        return res.status(200).json({
            status: 'success',
            message: 'Account deletion requested. Your data will be permanently removed after 30 days.',
            data: {
                deletionRequestedAt,
                deletionExpiresAt,
                deletionPeriod: 30
            }
        });
    } catch (e) {
        console.error('Error deleting account:', e);
        return res.status(500).json({
            status: 'error',
            message: 'Unable to delete account'
        });
    }
}




