import express from 'express';
import type{ Request, Response, Express, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import {xss} from 'express-xss-sanitizer';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/api.routes.js';
/* import * as mongoSanitizerModule from 'mongo-sanitizer'; */
dotenv.config();


connectDB();
const app: Express = express();
app.use(express.json());
/* const mongoSanitizer = (mongoSanitizerModule as any).default || mongoSanitizerModule;
app.use((req:Request, res: Response, next:NextFunction) => {
    if (req.body) mongoSanitizer(req.body);
    if (req.query) mongoSanitizer(req.query);
    if (req.params) mongoSanitizer(req.params);
    next();
}); */
// 1. Create a native, ultra-reliable sanitization function
const deepSanitize = (obj: any): any => {
    if (obj instanceof Object) {
        for (const key in obj) {
        if (/^\$/.test(key) || key.includes('.')) {
            delete obj[key]; // Drops NoSQL keys like $gt, $ne, etc.
        } else {
            deepSanitize(obj[key]); // Recursively checks nested objects
        }
        }
    }
    return obj;
};

app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.body) deepSanitize(req.body);
    if (req.params) deepSanitize(req.params);

    // Safe handling for Express 5's read-only req.query
    if (req.query) {
        try {
        const serialized = JSON.parse(JSON.stringify(req.query));
        const sanitized = deepSanitize(serialized);
        
        Object.defineProperty(req, 'query', {
            value: sanitized,
            writable: true,
            configurable: true,
            enumerable: true
        });
        } catch (e) {
        // Fallback if query object serialization fails
            console.error('Error sanitizing query object:', e);
        }
    }
    
    next();
});

app.use(xss());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // Update with your frontend URL
    credentials: true
}));

/* 
const oauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.OAUTH_MAX_REQUESTS || '50', 10), // Limit each IP to 50 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.AUTH_MAX_REQUESTS || '50', 10), // Limit each IP to 50 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
    }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.API_MAX_REQUESTS || '100', 10), // Limit each IP to 100 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
}) */



app.use('/api/v1' , apiRouter);


app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to DevSignal backend!');
});
//Catch not found routes
app.use('/{:splat}', (req: Request, res: Response) => {
    res.status(404).json({ 
        status: 'error', 
        message: 'Route not found' 
    });
});

app.use(errorHandler);

export default app;
