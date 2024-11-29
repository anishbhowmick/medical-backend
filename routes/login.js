import express from 'express';
import { Doctor, Patient } from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user is a doctor
    let user = await Doctor.findOne({ email });
    if (!user) {
      // Check if user is a patient
      user = await Patient.findOne({ email });
    }

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ error: 'Invalid credentials' });
    }

    // Redirect based on role
    if (user.role === 'doctor') {
      return res.redirect('https://docotr-dashboard.vercel.app');
    } else if (user.role === 'patient') {
      return res.redirect('https://patient-dashboard-pink.vercel.app');
    }
  } catch (error) {
    res.status(500).send({ error: 'Server error' });
  }
});

export default router; 