import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();
const prisma = new PrismaClient();

// 🔐 Only logged-in Teachers can access this
router.post('/create', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { title, description, type, questions } = req.body;
  
      if (req.user.role !== 'Teacher') {
        res.status(403).json({ message: 'Only teachers can create quizzes' });
        return;
      }
  
      const quiz = await prisma.quiz.create({
        data: {
          title,
          description,
          type,
          creatorId: req.user.userId,
          questions: {
            create: questions.map((q: any) => ({
              text: q.text,
              timer: q.timer,
              type: q.type,
              options: {
                create: q.options.map((o: any) => ({
                  text: o.text,
                  isCorrect: o.isCorrect,
                })),
              },
            })),
          },
        },
        include: { questions: { include: { options: true } } },
      });
  
      res.status(201).json({ message: 'Quiz created', quiz });
    } catch (err) {
      console.error('Quiz creation failed:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
export default router;
