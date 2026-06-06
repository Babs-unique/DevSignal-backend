import type { TokenPayload } from '../utils/jwt.js';

declare module 'express-serve-static-core' {
    interface Request {
        user?: TokenPayload;
    }
}

export {};
