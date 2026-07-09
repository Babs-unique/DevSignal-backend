import { User } from '../models/users.model.js';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Analysis } from '../models/analysis.model.js';
import cloudinary from '../middleware/cloudinary.js';
import { Readable } from 'stream';

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
        const isMatch = await bcrypt.compare(currentPassword, user.password!);
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

export const exportData = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    
    if (!userId) {
        return res.status(401).json({
            status: 'error',
            success: false,
            message: 'User not authenticated'
        });
    }

    try {
        // 1. Check if at least one document exists before starting the download
        const hasData = await Analysis.exists({ userId });
        
        if (!hasData) {
            return res.status(404).json({
                status: 'error',
                success: false,
                message: 'No analyses found'
            });
        }

        // 2. Set headers immediately to initiate the file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="analyses_data.json"');
        res.status(200);

        // 3. Open a stream cursor from MongoDB
        const cursor = Analysis.find({ userId }).lean().cursor();
        
        // 4. Stream valid JSON array structure chunks to the client
        res.write('[\n'); 
        let isFirst = true;

        cursor.on('data', (doc) => {
            if (!isFirst) {
                res.write(',\n'); // Add comma between JSON objects
            }
            res.write(JSON.stringify(doc, null, 2));
            isFirst = false;
        });

        cursor.on('end', () => {
            res.write('\n]'); // Close the JSON array syntax
            res.end();       // Close the HTTP connection
        });

        cursor.on('error', (streamErr) => {
            console.error('Streaming error:', streamErr);
            // Connection is already open with 200 headers, so we just destroy it
            res.destroy(); 
        });

    } catch (e) {
        console.error('Error exporting data:', e);
        return res.status(500).json({
            status: 'error',
            success: false,
            message: 'Error exporting data'
        });
    }
};

export const avatarUpload = async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({
            status: 'error',
            success: false,
            message: 'User not authenticated'
        });
    }

    if (!req.file) {
        return res.status(400).json({
            status: 'error',
            success: false,
            message: 'Please provide an image file'
        });
    }

    try {
        const uploadedAvatar = await new Promise<{ secure_url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'devsignal/avatars',
                    resource_type: 'image',
                    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    if (!result?.secure_url) {
                        reject(new Error('Avatar upload failed'));
                        return;
                    }

                    resolve(result as { secure_url: string });
                }
            );

            const bufferStream = new Readable();
            bufferStream.push(req.file?.buffer);
            bufferStream.push(null);
            bufferStream.pipe(uploadStream);
        });

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                success: false,
                message: 'User not found'
            });
        }

        user.avatarUrl = uploadedAvatar.secure_url;
        await user.save();

        return res.status(200).json({
            status: 'success',
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                avatarUrl: user.avatarUrl
            }
        });
    } catch (e) {
        console.error('Error uploading avatar:', e);
        return res.status(500).json({
            status: 'error',
            success: false,
            message: 'Error uploading avatar'
        });
    }
};

//FUTURE IMPLEMENTATION

/* export const dataRetentionPeriod = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if(!userId){
        return res.status(401).json({
            status: 'error',
            success: false,
            message: 'User not authenticated'
        })
    }
} */