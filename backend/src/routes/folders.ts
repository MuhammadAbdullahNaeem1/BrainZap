import express, { Request, Response } from 'express';
import { pool } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = express.Router();

// POST /api/folders — create a new folder
router.post(
  '/folders',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) {
      res.status(400).json({ message: 'Folder name required' });
      return;
    }
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO folders (name, owner_id) VALUES (?, ?)`,
        [name.trim(), req.user.userId]
      );
      res.status(201).json({ folderId: result.insertId, name });
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Folder already exists' });
        return;
      }
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/folders — list all folders for this teacher
router.get(
  '/folders',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT folder_id AS folderId, name
           FROM folders
          WHERE owner_id = ?
          ORDER BY created_at`,
        [req.user.userId]
      );
      res.json({ folders: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
