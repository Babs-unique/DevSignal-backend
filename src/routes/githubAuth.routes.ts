import { Router } from "express";
import express from 'express';
import { initiateGithubOAuth, handleGithubOauthCallback, refreshToken as refreshOAuthToken } from '../controllers/githubOauth.controller.js';
import { refreshToken, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';


const router: Router = express.Router();

// GitHub OAuth routes
router.get('/github', initiateGithubOAuth);
router.get('/github/callback', handleGithubOauthCallback);
router.post('/github/refresh', refreshOAuthToken);

// Unified auth routes (works for both email/password and GitHub OAuth users)
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);


export default router;