import express from 'express';
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import authMiddleware from '../middleware/authmiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getCategories);
router.post('/add', authMiddleware, addCategory);
router.put('/:id', authMiddleware, updateCategory);
router.delete('/:id', authMiddleware, deleteCategory);

export default router;