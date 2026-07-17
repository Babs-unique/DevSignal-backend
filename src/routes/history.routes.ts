import express from 'express'
import type { Router } from 'express'
import { 
    getHistory,
    getHistoryMetric,
    searchHistory,
    getHistoryById,
    deleteHistoryById,
    duplicateAnalysesById
} from '../controllers/history.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';



const router: Router = express.Router();


router.get('/', authenticate, getHistory);
router.get('/metric', authenticate, getHistoryMetric);
router.get('/search', authenticate, searchHistory);
router.get('/:id', authenticate, getHistoryById);
router.delete('/:id', authenticate, deleteHistoryById);
router.post('/:id/duplicate', authenticate, duplicateAnalysesById);


export default router