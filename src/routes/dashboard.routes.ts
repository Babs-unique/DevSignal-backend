import {
    getDashboard,
    getLatestAnalysesById
} from '../controllers/dashboard.controller.js';
import express, { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';


const router : Router = express.Router();


router.get('/', authenticate, getDashboard);
router.get('/latest/:id', authenticate, getLatestAnalysesById);

export default router;