import { githubConfig } from '../config/github.js';
import { githubAccessToken, githubUser } from './github.service.js';
import { User } from '../models/users.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';



export const userLoginOrRegister = async (githubUserData: any) => {
    let user = await User.findOne({ githubId: githubUserData.id });
    if (!user) {
        user = new User({
            githubId: githubUserData.id,
            email: githubUserData.email,
            name: githubUserData.name || githubUserData.login,
        });
        await user.save();
    }
    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });
    const updatedUser = await User.findOneAndUpdate(
        { githubId: githubUserData.id },
        { refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), isRevoked: false },
        { new: true }
    );
    return { user: updatedUser, accessToken, refreshToken };
}


export const refreshGithubToken = async (oldRefreshToken: string) => {
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


export const logoutGithubUser = async (refreshToken: string) => {
    if (!refreshToken) {
        throw new Error('Refresh token is required');
    }

    const user = await User.findOne({ 
        refreshToken,
        isRevoked: false, 
        expiresAt: { $gt: new Date() }
    });
    if (user) {
        user.isRevoked = true;
        await user.save();
    }
}