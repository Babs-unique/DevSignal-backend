import jwt from 'jsonwebtoken';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
    userId: string;
}

const buildToken = (payload: TokenPayload) => ({
    userId: payload.userId
});

const isTokenPayload = (payload: string | JwtPayload): payload is TokenPayload & JwtPayload => {
    return typeof payload !== 'string' && typeof payload.userId === 'string';
};

const generateAccessToken = (payload: TokenPayload) => {
    const expiresIn = env.JWT_SECRET_EXPIRES as SignOptions['expiresIn'];

    return jwt.sign(
        buildToken(payload),
        env.JWT_SECRET,
        { expiresIn }
    );
};

const generateRefreshToken = (payload:TokenPayload) => {
    const expiresIn = env.JWT_REFRESH_SECRET_EXPIRES as SignOptions['expiresIn'];

    return jwt.sign(
        buildToken(payload),
        env.JWT_REFRESH_SECRET,
        { expiresIn }
    );
};

const verifyAccessToken = (token: string): TokenPayload => {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (!isTokenPayload(decoded)) {
        throw new Error('Invalid access token payload');
    }

    return {
        userId: decoded.userId
    };
};

const verifyRefreshToken = (token: string): TokenPayload => {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);

    if (!isTokenPayload(decoded)) {
        throw new Error('Invalid refresh token payload');
    }

    return {
        userId: decoded.userId
    };
};

export { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };

