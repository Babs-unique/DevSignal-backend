import dotenv from 'dotenv';

dotenv.config();

interface EnvironmentVariables {
    PORT: string | number;
    MONGODB_URI: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_SECRET_EXPIRES: string;
    JWT_REFRESH_SECRET_EXPIRES: string;
    OPENAI_API_KEY: string,
    GEMINI_API_KEY: string,
    TURNSTILE_SECRET_KEY: string,
    CLIENT_URL: string,
    API_PUBLIC_URL: string
}

const extractEnvironmentVariables = (): EnvironmentVariables => {
    return {
        PORT: process.env.PORT || 5000,
        MONGODB_URI: process.env.MONGODB_URI || '',
        JWT_SECRET: process.env.JWT_SECRET || 'dev-access-secret',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
        JWT_SECRET_EXPIRES: process.env.JWT_SECRET_EXPIRES || '15m',
        JWT_REFRESH_SECRET_EXPIRES: process.env.JWT_REFRESH_SECRET_EXPIRES || '7d',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
        TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || '',
        CLIENT_URL: process.env.CLIENT_URL || '',
        API_PUBLIC_URL: process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`
    };
};

export const env = extractEnvironmentVariables();

export default env;
