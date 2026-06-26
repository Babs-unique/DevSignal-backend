import { User } from '../models/users.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';


export const userLoginOrRegister = async (googleUserData: any) => {
    if (!googleUserData.email) {
        throw new Error('Google account did not provide an email address');
    }

    let user = await User.findOne({ googleId: googleUserData.sub });

    if (!user) {
        user = await User.findOne({ email: googleUserData.email });
    }

    if (!user) {
        user = await User.create({
            googleId: googleUserData.sub,
            email: googleUserData.email,
            name: googleUserData.name || googleUserData.email.split('@')[0],
            avatarUrl: googleUserData.picture,
        });
    } else {
        if (user.googleId && user.googleId !== googleUserData.sub) {
            throw new Error('This email is already linked to a different Google account');
        }

        user.googleId = user.googleId || googleUserData.sub;
        user.name = user.name || googleUserData.name || googleUserData.email.split('@')[0];
        user.avatarUrl = user.avatarUrl || googleUserData.picture;
    }

    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });

    user.refreshToken = refreshToken;
    user.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.isRevoked = false;
    await user.save();

    return { user, accessToken, refreshToken };
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
