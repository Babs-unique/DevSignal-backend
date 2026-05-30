import express from 'express';
import type{ Request, Response, Express } from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();


connectDB();
const app: Express = express();
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));


app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to DevSignal backend!');
});

export default app;