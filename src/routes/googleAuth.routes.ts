import { Router } from 'express'
import express from 'express';
import {
    handleGoogleOauthCallback,
    initiateGoogleOAuth,
    refreshAccessToken,
    getGoogleUserProfile
} from '../controllers/googleOauth.controller.js';
import { logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';


const router: Router = express.Router();

router.get('/google', initiateGoogleOAuth);
router.get('/google/callback', handleGoogleOauthCallback);
router.post('/google/refresh', refreshAccessToken);
router.get('/google/profile', getGoogleUserProfile);

// Use unified logout for all user types
router.post('/logout', authenticate, logout);


export default router;

