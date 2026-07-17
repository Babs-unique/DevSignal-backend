import {
    getSettings,
    updatePassword,
    exportData,
    avatarUpload as uploadAvatarController
} from '../controllers/settings.controller.js';
import express, { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { avatarUpload as uploadAvatarMiddleware } from '../middleware/multer.js';


const router: Router = express.Router();


router.get('/', authenticate, getSettings);
router.patch('/password', authenticate, updatePassword);
router.post('/avatar', authenticate, uploadAvatarMiddleware.single('avatar'), uploadAvatarController);
router.get('/export', authenticate, exportData);


export default router;