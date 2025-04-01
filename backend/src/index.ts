import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import quizRoutes from './routes/quiz'; 
import { authenticateToken, AuthRequest } from './middleware/authMiddleware';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);

// Example protected route
app.get('/api/protected', authenticateToken, (req: AuthRequest, res) => {
  res.json({ message: 'Protected content', user: req.user });
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
