import { User } from '../models/users.model.js';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export const getSettings = async( req: Request, res:Response) => {
    const userId = req.user?.userId;
    if(!userId){
        return res.status(401).json({
            status: 'error',
            success: false,
            message: 'User not authenticated'
        });
    }
    try{
        const user = await User.findById(userId).select('-password -refreshToken -resetToken -resetTokenExpiry');
        if(!user){
            return res.status(404).json({
                status: 'error',
                success: false,
                message: 'User not found'
            });
        }
        return res.status(200).json({
            status: 'success',
            success: true,
            data: {
                user
            }
        });

    }catch(e){
        console.error('Error fetching settings:', e);
        return res.status(500).json({
            status: 'error',
            success: false,
            message: 'Error fetching settings'
        });
    }
}
export const deleteAccount = async ( req: Request, res:Response) =>{
    const userId = req.user?.userId;
    if(!userId){
        return res.status(401).json({
            status: 'error',
            success: false,
            message: 'User not authenticated'
        })
    }
    try{
        const user = await User.findByIdAndDelete(userId);
        if(!user){
            return res.status(404).json({
                status: 'error',
                success: false,
                message: 'User not found'
            })
        }
        return res.status(200).json({
            status: 'success',
            success: true,
            message: 'Account deleted successfully'
        })
    }catch(e){
        console.error('Error deleting account:', e);
        return res.status(500).json({
            status: 'error',
            success: false,
            message: 'Error deleting account'
        })
    }
}

export const updatePassword = async ( req: Request, res:Response) =>{
    const userId = req.user?.userId;
    if(!userId){
        return res.status(401).json({
            status: 'error',
            success: false,
            message: 'User not authenticated'
        })
    }
    const { currentPassword , newPassword } = req.body;
    if(!currentPassword || !newPassword){
        return res.status(400).json({
            status: 'error',
            success: false,
            message: 'Current password and new password are required'
        })
    }
    if(newPassword.length < 8){
        return res.status(400).json({
            status: 'error',
            success: false,
            message: 'Password must be at least 8 characters'
        })
    }
    if(currentPassword === newPassword){
        return res.status(400).json({
            status: 'error',
            success: false,
            message: 'New password and confirm password must be different'
        })
    }
    try {
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                status: 'error',
                success: false,
                message: 'User not found'
            })
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if(!isMatch){
            return res.status(400).json({
                status: 'error',
                success: false,
                message: 'Current password is incorrect'
            })
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        await user.save();
        return res.status(200).json({
            status: 'success',
            success: true,
            message: 'Password updated successfully'
        })
        
    } catch (e) {
        console.error('Error updating password:', e);
        return res.status(500).json({
            status: 'error',
            success: false,
            message: 'Error updating password'
        })  
    }
}
