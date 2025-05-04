// src/routes/quizRoutes.ts

import express from 'express';
import { getQuizzes } from '../controllers/quizController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Route to get all quizzes
router.get('/quizzes', authenticateToken, getQuizzes);

export default router;
