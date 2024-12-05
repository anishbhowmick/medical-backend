import express from 'express';
import { Doctor } from '../models/User.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/doctors/:id', authenticateToken, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-password'); // Exclude password
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (error) {
    console.error('Error fetching doctor details:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 