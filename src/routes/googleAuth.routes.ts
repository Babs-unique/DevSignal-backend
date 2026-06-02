import { Router } from 'express'
import express from 'express';
import {
    handleGoogleOauthCallback,
    initiateGoogleOAuth,
    refreshAccessToken,
    getGoogleUserProfile,
    logout
} from '../controllers/googleOauth.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';


const router: Router = express.Router();

router.get('/google', initiateGoogleOAuth);
router.get('/google/callback', handleGoogleOauthCallback);
router.post('/google/refresh', refreshAccessToken);
router.get('/google/profile', getGoogleUserProfile);
router.post('/google/logout', authenticate, logout);


export default router;

