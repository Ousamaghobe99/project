import express from 'express';
import { createBudget, getAllBudgets, deleteBudget,updateBudget } from '../controllers/budgetController.js';
import authMiddleware from '../middleware/authmiddleware.js';

const router = express.Router();

router.get('/:id?', authMiddleware, getAllBudgets);
router.post('/create', authMiddleware, createBudget);
router.put('/:id', authMiddleware, updateBudget);
router.delete('/:id', authMiddleware, deleteBudget);

export default router;