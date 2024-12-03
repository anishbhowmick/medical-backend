import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', authenticateToken, (req, res) => {
  // Access the authenticated user's information via req.user
  res.send({ message: `Welcome, ${req.user.name}` });
});

export default router; 