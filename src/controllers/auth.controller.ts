import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Request, Response } from 'express'
import { User } from '../models/users.model.js'


export const register = async (req: Request, res: Response) => {
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

        return

    }catch(e){
        return res.status(500).json({
            status: 'error',
            message: 'Server error'
        }) 
    }
}