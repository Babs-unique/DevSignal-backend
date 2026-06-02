import { googleConfig} from '../config/google.js';
import { googleAccessToken, googleUser } from './google.service.js';
import { User } from '../models/users.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';


export const userLoginOrRegister = async (googleUserData: any) => {
    let user = await User.findOne({ googleId: googleUserData.sub });
    if (!user) {    
        user = new User({
            googleId: googleUserData.sub,
            email: googleUserData.email,
            name: googleUserData.name
        });
        await user.save();
    }
    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });
    const updatedUser = await User.findOneAndUpdate(
        { googleId: googleUserData.sub },
        { refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), isRevoked: false },
        { new: true }
    );
    return { user: updatedUser, accessToken, refreshToken };
}


export const refreshGoogleToken = async (oldRefreshToken: string) => {
    if (!oldRefreshToken) {
        throw new Error('Refresh token is required');
    }
    const verified = await verifyRefreshToken(oldRefreshToken);
    const user = await User.findOne({
        _id: verified.userId, 
        refreshToken: oldRefreshToken,
        isRevoked: false ,
        expiresAt: { $gt: new Date() }
    });
    if (!user) {
        throw new Error('Invalid or expired refresh token');
    }
    user.isRevoked = true;
    await user.save();
    const newAccessToken = generateAccessToken({ userId: user.id });
    const newRefreshToken = generateRefreshToken({ userId: user.id });
    const updatedUser = await User.findByIdAndUpdate(
        user.id,
        { refreshToken: newRefreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), isRevoked: false },
        { new: true }
    );
    return { user: updatedUser, accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export const logoutGoogleUser = async (refreshToken: string) => {
    if (!refreshToken) {
        throw new Error('Refresh token is required');
    }
    const verified = await verifyRefreshToken(refreshToken);
    const user = await User.findOne({
        _id: verified.userId, 
        refreshToken: refreshToken,
        isRevoked: false ,
        expiresAt: { $gt: new Date() }
    });
    if (!user) {
        throw new Error('Invalid or expired refresh token');
    }
    if (user) {
        user.isRevoked = true;
        await user.save();
    }
}