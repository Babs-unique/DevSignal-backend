import { User } from '../models/users.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';



export const userLoginOrRegister = async (githubUserData: any) => {
    if (!githubUserData.email) {
        throw new Error('GitHub account did not provide a verified email address');
    }

    let user = await User.findOne({ githubId: githubUserData.id });

    if (!user) {
        user = await User.findOne({ email: githubUserData.email });
    }

    if (!user) {
        user = await User.create({
            githubId: githubUserData.id,
            email: githubUserData.email,
            name: githubUserData.name || githubUserData.login,
            avatarUrl: githubUserData.avatar_url,
        });
    } else {
        if (user.githubId && user.githubId !== githubUserData.id) {
            throw new Error('This email is already linked to a different GitHub account');
        }

        user.githubId = user.githubId || githubUserData.id;
        user.name = user.name || githubUserData.name || githubUserData.login;
        user.avatarUrl = user.avatarUrl || githubUserData.avatar_url;
    }

    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });

    user.refreshToken = refreshToken;
    user.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.isRevoked = false;
    await user.save();

    return { user, accessToken, refreshToken };
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
