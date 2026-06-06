import dotenv from 'dotenv';

dotenv.config();

interface EnvironmentVariables {
    PORT: string | number;
    MONGO_URI: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_SECRET_EXPIRES: string;
    JWT_REFRESH_SECRET_EXPIRES: string;
    OPEN_API_KEY: string
}

const extractEnvironmentVariables = (): EnvironmentVariables => {
    return {
        PORT: process.env.PORT || 5000,
        MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/devsignal',
        JWT_SECRET: process.env.JWT_SECRET || 'dev-access-secret',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
        JWT_SECRET_EXPIRES: process.env.JWT_SECRET_EXPIRES || '15m',
        JWT_REFRESH_SECRET_EXPIRES: process.env.JWT_REFRESH_SECRET_EXPIRES || '7d',
        OPEN_API_KEY: process.env.OPEN_API_KEY || ''
    };
};

export const env = extractEnvironmentVariables();

export default env;
