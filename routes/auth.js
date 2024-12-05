import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/user', authenticateToken, (req, res) => {
  res.send(req.user); // Send user data attached in the token
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.send({ message: 'Logged out successfully' });
});

export default router; 