// src/controllers/quizController.ts

import { Request, Response } from 'express';
import mysql from 'mysql2';

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,          // Using DB_HOST from .env
    user: process.env.DB_USER,          // Using DB_USER from .env
    password: process.env.DB_PASSWORD,  // Using DB_PASSWORD from .env
    database: process.env.DB_NAME,      // Using DB_NAME from .env
  });

// Controller for fetching quizzes
export const getQuizzes = (req: Request, res: Response) => {
  const sqlQuery = 'SELECT quiz_id, title FROM quizzes';

  db.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error fetching quizzes:', err);
      return res.status(500).json({ message: 'Server error fetching quizzes' });
    }

    // Ensure results are an array (RowDataPacket[]), not OkPacket
    if (Array.isArray(results) && results.length > 0) {
      res.json({ quizzes: results });
    } else {
      res.status(404).json({ message: 'No quizzes found' });
    }
  });
};
