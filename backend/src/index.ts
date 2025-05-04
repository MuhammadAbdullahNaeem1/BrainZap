// src/index.ts

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import quizRoutes from './routes/quiz';
import foldersRouter from './routes/folders'; 
import { authenticateToken, AuthRequest } from './middleware/authMiddleware';

const app = express();

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enable CORS
app.use(cors());

// Authentication routes
app.use('/api/auth', authRoutes);

// Folder routes (create & list folders)
app.use('/api', foldersRouter);

// Quiz routes (create, list, move, delete)
app.use('/api/quiz', quizRoutes);

// Example protected endpoint
app.get(
  '/api/protected',
  authenticateToken,
  (req: AuthRequest, res) => {
    res.json({ message: 'Protected content', user: req.user });
  }
);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
