// src/routes/quiz.ts

import express, { Request, Response } from 'express';
import { pool } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = express.Router();

/**
 * POST /api/quiz/create
 */
router.post(
  '/create',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, type, themeImage, questions, folderId } = req.body as {
      title: string;
      type: string;
      themeImage?: string;
      questions: Array<{
        text: string;
        timer: number;
        type: string;
        image?: string;
        audio?: string;
        video?: string;
        points: number;
        mediaOrder?: Array<'image' | 'audio' | 'video'>;
        options: Array<{
          text: string;
          isCorrect: boolean;
          image?: string;
          audio?: string;
          video?: string;
          mediaOrder?: Array<'image' | 'audio' | 'video'>;
        }>;
      }>;
      folderId?: number;
    };

    if (req.user.role !== 'Teacher') {
      res.status(403).json({ message: 'Only teachers can create quizzes' });
      return;
    }

    const userId = req.user.userId;
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1) create quiz
      const [quizResult] = await conn.execute<ResultSetHeader>(
        `INSERT INTO quizzes (title, quiz_type, theme_image, author_id)
         VALUES (?, ?, ?, ?)`,
        [title, type, themeImage || null, userId]
      );
      const quizId = quizResult.insertId;

      // 2) assign to folder if provided
      if (folderId && folderId > 0) {
        await conn.execute(
          `REPLACE INTO quiz_folders (quiz_id, folder_id) VALUES (?, ?)`,
          [quizId, folderId]
        );
      }

      // 3) insert questions and options with media_order
      for (const q of questions) {
        // MCQ validation
        if (q.type === 'MCQ') {
          const correctCount = q.options.filter(o => o.isCorrect).length;
          if (correctCount !== 1) {
            throw new Error('Each MCQ must have exactly one correct answer');
          }
        }

        const mediaOrderQ = JSON.stringify(q.mediaOrder || []);
        const [qRes] = await conn.execute<ResultSetHeader>(
          `INSERT INTO questions
             (quiz_id, question_text, timer, question_type, image, audio, video, points, media_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            quizId,
            q.text,
            q.timer,
            q.type,
            q.image || null,
            q.audio || null,
            q.video || null,
            q.points || 0,
            mediaOrderQ,
          ]
        );
        const questionId = qRes.insertId;

        for (const o of q.options) {
          const mediaOrderO = JSON.stringify(o.mediaOrder || []);
          await conn.execute(
            `INSERT INTO options
               (question_id, option_text, image, audio, video, is_correct, media_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              questionId,
              o.text,
              o.image || null,
              o.audio || null,
              o.video || null,
              o.isCorrect ? 1 : 0,
              mediaOrderO,
            ]
          );
        }
      }

      await conn.commit();
      res.status(201).json({ message: 'Quiz created', quizId });
    } catch (err: any) {
      await conn.rollback();
      console.error('Quiz creation failed:', err);
      res.status(500).json({ message: err.message || 'Server error' });
    } finally {
      conn.release();
    }
  }
);

/**
 * GET /api/quiz/my-quizzes
 */
router.get(
  '/my-quizzes',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.userId;
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT
           q.quiz_id    AS quizId,
           q.title      AS title,
           q.created_at AS createdAt,
           COUNT(ques.question_id) AS questionsCount,
           COALESCE(qf.folder_id, 0) AS folderId
         FROM quizzes q
         LEFT JOIN questions ques ON ques.quiz_id = q.quiz_id
         LEFT JOIN quiz_folders qf ON qf.quiz_id = q.quiz_id
         WHERE q.author_id = ?
         GROUP BY q.quiz_id
         ORDER BY q.created_at DESC`,
        [userId]
      );
      res.json({ quizzes: rows });
    } catch (err) {
      console.error('Fetching quizzes failed:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * GET /api/quiz/:id
 */
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const quizId = Number(req.params.id);
    if (!quizId) {
      res.status(400).json({ message: 'Invalid quiz ID' });
      return;
    }

    try {
      const userId = req.user.userId;
      // 1) quiz meta
      const [quizRows] = await pool.query<RowDataPacket[]>(
        `SELECT
           quiz_id    AS quizId,
           title,
           quiz_type  AS type,
           theme_image AS themeImage
         FROM quizzes
         WHERE quiz_id = ? AND author_id = ?`,
        [quizId, userId]
      );
      const quiz = quizRows[0];
      if (!quiz) {
        res.status(404).json({ message: 'Quiz not found or unauthorized' });
        return;
      }

      // 2) questions with media_order
      const [questions] = await pool.query<RowDataPacket[]>(
        `SELECT
           question_id   AS questionId,
           question_text AS text,
           timer,
           question_type AS type,
           image,
           audio,
           video,
           points,
           media_order   AS mediaOrder
         FROM questions
         WHERE quiz_id = ?`,
        [quizId]
      );

      // 3) options with media_order
      for (const q of questions as any[]) {
        const [opts] = await pool.query<RowDataPacket[]>(
          `SELECT
             option_id     AS optionId,
             option_text   AS text,
             image,
             audio,
             video,
             is_correct    AS isCorrect,
             media_order   AS mediaOrder
           FROM options
           WHERE question_id = ?`,
          [q.questionId]
        );
        q.options = opts;
      }

      // 4) folder assignment
      const [folderRows] = await pool.query<RowDataPacket[]>(
        `SELECT folder_id FROM quiz_folders WHERE quiz_id = ?`,
        [quizId]
      );
      const folderId = folderRows.length > 0 ? folderRows[0].folder_id : 0;

      res.json({ ...quiz, questions, folderId });
    } catch (err) {
      console.error('Fetching quiz failed:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * PUT /api/quiz/:id
 */
router.put(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const quizId = Number(req.params.id);
    if (!quizId) {
      res.status(400).json({ message: 'Invalid quiz ID' });
      return;
    }

    const userId = req.user.userId;
    const { title, type, themeImage, questions, folderId } = req.body as {
      title: string;
      type: string;
      themeImage?: string;
      questions: Array<{
        text: string;
        timer: number;
        type: string;
        image?: string;
        audio?: string;
        video?: string;
        points: number;
        mediaOrder?: Array<'image' | 'audio' | 'video'>;
        options: Array<{
          text: string;
          isCorrect: boolean;
          image?: string;
          audio?: string;
          video?: string;
          mediaOrder?: Array<'image' | 'audio' | 'video'>;
        }>;
      }>;
      folderId?: number;
    };

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // ownership check
      const [[owner]] = await conn.query<RowDataPacket[]>(
        `SELECT quiz_id FROM quizzes WHERE quiz_id = ? AND author_id = ?`,
        [quizId, userId]
      );
      if (!owner) {
        res.status(404).json({ message: 'Quiz not found or unauthorized' });
        await conn.rollback();
        return;
      }

      // update quiz meta
      await conn.execute(
        `UPDATE quizzes
           SET title = ?, quiz_type = ?, theme_image = ?
         WHERE quiz_id = ?`,
        [title, type, themeImage || null, quizId]
      );

      // update folder
      if (folderId && folderId > 0) {
        await conn.execute(
          `REPLACE INTO quiz_folders (quiz_id, folder_id) VALUES (?, ?)`,
          [quizId, folderId]
        );
      } else {
        await conn.execute(`DELETE FROM quiz_folders WHERE quiz_id = ?`, [quizId]);
      }

      // clear old questions & options
      await conn.execute(
        `DELETE o FROM options o
           JOIN questions q ON o.question_id = q.question_id
          WHERE q.quiz_id = ?`,
        [quizId]
      );
      await conn.execute(`DELETE FROM questions WHERE quiz_id = ?`, [quizId]);

      // re-insert questions & options
      for (const q of questions) {
        if (q.type === 'MCQ') {
          const correctCount = q.options.filter(o => o.isCorrect).length;
          if (correctCount !== 1) {
            throw new Error('Each MCQ must have exactly one correct answer');
          }
        }
        const mediaOrderQ = JSON.stringify(q.mediaOrder || []);
        const [qRes] = await conn.execute<ResultSetHeader>(
          `INSERT INTO questions
             (quiz_id, question_text, timer, question_type, image, audio, video, points, media_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            quizId,
            q.text,
            q.timer,
            q.type,
            q.image || null,
            q.audio || null,
            q.video || null,
            q.points || 0,
            mediaOrderQ,
          ]
        );
        const questionId = qRes.insertId;

        for (const o of q.options) {
          const mediaOrderO = JSON.stringify(o.mediaOrder || []);
          await conn.execute(
            `INSERT INTO options
               (question_id, option_text, image, audio, video, is_correct, media_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              questionId,
              o.text,
              o.image || null,
              o.audio || null,
              o.video || null,
              o.isCorrect ? 1 : 0,
              mediaOrderO,
            ]
          );
        }
      }

      await conn.commit();
      res.json({ message: 'Quiz updated' });
    } catch (err: any) {
      await conn.rollback();
      console.error('Quiz update failed:', err);
      res.status(500).json({ message: err.message || 'Server error' });
    } finally {
      conn.release();
    }
  }
);

/**
 * DELETE /api/quiz/:id
 */
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const quizId = Number(req.params.id);
    if (!quizId) {
      res.status(400).json({ message: 'Invalid quiz ID' });
      return;
    }
    const userId = req.user.userId;

    try {
      const [[owner]] = await pool.query<RowDataPacket[]>(
        `SELECT quiz_id FROM quizzes WHERE quiz_id = ? AND author_id = ?`,
        [quizId, userId]
      );
      if (!owner) {
        res.status(404).json({ message: 'Quiz not found or unauthorized' });
        return;
      }
      await pool.execute(`DELETE FROM quizzes WHERE quiz_id = ?`, [quizId]);
      res.json({ message: 'Quiz deleted successfully' });
    } catch (err) {
      console.error('Quiz deletion failed:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
