import express from 'express';
import { Doctor, Patient } from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

const JWT_SECRET = '9da0d0375b9058133a9044663dffe753772dfe86c6f48f3caac81dcd37df4c222b1f92852a2f037c7c9b5316c994f29ee26bf599b216209ead76fd9c5a12dad6';
console.log('JWT_SECRET:', JWT_SECRET);

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    let user;
    if (role === 'doctor') {
      user = await Doctor.findOne({ email });
    } else if (role === 'patient') {
      user = await Patient.findOne({ email });
    } else {
      return res.status(400).send({ error: 'Invalid role' });
    }

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ error: 'Invalid credentials' });
    }

    // Create payload for JWT
    const payload = {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
    };

    // Generate JWT token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };

    res.status(200).send({ message: 'Login successful', token, user: userData });
    if (user.role === 'doctor') {
      return res.redirect('https://docotr-dashboard.vercel.app/');
    } else if (user.role === 'patient') {
      return res.redirect('https://patient-dashboard-pink.vercel.app/');
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

export default router; 