// src/routes/auth.ts

import express, { Request, Response } from 'express';
import { pool } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_env';

// POST /auth/register
router.post(
  '/register',
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    if (!name || !email || !password || !role) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    try {
      // 1) Check if user already exists
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT user_id FROM users WHERE email = ?`,
        [email]
      );
      if (rows.length > 0) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }

      // 2) Hash password
      const hashed = await bcrypt.hash(password, 10);

      // 3) Insert new user
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO users (user_name, email, user_password, user_role)
         VALUES (?, ?, ?, ?)`,
        [name, email, hashed, role]
      );

      res
        .status(201)
        .json({ message: 'User registered', userId: result.insertId });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /auth/login
router.post(
  '/login',
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    try {
      // 1) Fetch user by email, including the hashed password
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
           user_id         AS userId,
           user_role       AS role,
           user_password   AS hash
         FROM users
         WHERE email = ?`,
        [email]
      );

      if (rows.length === 0) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      const user = rows[0] as {
        userId: number;
        role: string;
        hash: string;
      };

      // 2) Compare submitted password against stored hash
      const match = await bcrypt.compare(password, user.hash);
      if (!match) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      // 3) Issue JWT
      const token = jwt.sign(
        { userId: user.userId, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ message: 'Login successful', token, role: user.role });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
