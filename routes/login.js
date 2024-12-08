import express from 'express';
import { Doctor, Patient } from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

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

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Ensure HTTPS in production
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });

    // Prepare user data with additional fields
    const userData = {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      specialty: user.specialty || '',
      qualifications: user.qualifications || [],
      experience: user.experience || 0,
      avatar: user.avatar || '',
      age: user.age || '',
      gender: user.gender || '',
      bloodGroup: user.bloodGroup || '',
      primaryContact: user.primaryContact || '',
      emergencyContact: user.emergencyContact || '',
      lastVisit: user.lastVisit || '',
      status: user.status || '',
      bloodPressure: user.bloodPressure || '',
      heartRate: user.heartRate || '',
      bloodSugar: user.bloodSugar || '',
      weight: user.weight || '',
      height: user.height || '',
    };

    // Send token and user data in the response body
    res.status(200).send({ message: 'Login successful', user: userData, token });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

export default router; 