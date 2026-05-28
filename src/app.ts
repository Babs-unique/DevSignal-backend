import express from 'express';
import type{ Request, Response, Express } from 'express';
import { connectDB } from './config/db.js';


connectDB();
const app: Express = express();
app.use(express.json());


app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to DevSignal backend!');
});

export default app;