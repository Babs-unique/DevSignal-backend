import {
    newAnalyses
} from '../controllers/analyses.controller.js';
import express, { Router } from 'express';
import { resumeUpload } from '../middleware/multer.js'
import { authenticate } from '../middleware/authMiddleware.js';


const router : Router = express.Router();

router.post('/newAnalyses', authenticate , resumeUpload.single('resume') , newAnalyses)



export default router;