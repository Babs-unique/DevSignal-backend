import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { User } from '../models/users.model.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

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
