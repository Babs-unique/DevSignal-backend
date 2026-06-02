import express from 'express';
import type{ Request, Response, Express } from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimiter from 'express-rate-limit';
import authRouter from './routes/auth.routes.js';
import githubAuthRouter from './routes/githubAuth.routes.js';
import googleAuthRouter from './routes/googleAuth.routes.js';

dotenv.config();


connectDB();
const app: Express = express();
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Update with your frontend URL
    credentials: true
}));


const oauthLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.OAUTH_MAX_REQUESTS || '50', 10), // Limit each IP to 50 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
    }
});

const authLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.AUTH_MAX_REQUESTS || '50', 10), // Limit each IP to 50 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
    }
});

const apiLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.API_MAX_REQUESTS || '100', 10), // Limit each IP to 100 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
})



app.use('/api/auth', authLimiter, authRouter);
app.use('/api/auth', oauthLimiter, githubAuthRouter);
app.use('/api/auth', oauthLimiter, googleAuthRouter);


app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to DevSignal backend!');
});

export default app;