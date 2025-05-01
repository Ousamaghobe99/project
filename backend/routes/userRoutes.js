import express from 'express';
import authMiddleware from '../middleware/authmiddleware.js';
import { getUsers,changePassword,updateUser } from '../controllers/userController.js';

const router = express.Router();

router.get("/", authMiddleware,getUsers);

//router.delete("/:id", authMiddleware,deleteuser);
router.put("/changePassword", authMiddleware,changePassword);
router.put("/", authMiddleware,updateUser);

export default router;