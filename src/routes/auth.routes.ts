import { Router } from 'express';
import express from 'express';
import {
    login,
    register,
    refreshToken,
    logout
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { loginSchema , registerSchema } from '../schema/authSchema.js';
import { validateRequest } from '../middleware/validationResource.js';


const router: Router = express.Router();

// Email/password auth routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);


export default router;