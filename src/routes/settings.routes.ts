import {
    getSettings,
    deleteAccount,
    updatePassword,
    exportData
} from '../controllers/settings.controller.js';
import express, { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';


const router: Router = express.Router();


router.get('/', authenticate, getSettings);
router.delete('/', authenticate, deleteAccount);
router.patch('/password', authenticate, updatePassword);
router.get('/export', authenticate, exportData);


export default router;