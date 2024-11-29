import express from 'express';
import { Doctor, Patient } from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === 'doctor') {
      const doctor = new Doctor({ firstName, lastName, email, password: hashedPassword, role });
      await doctor.save();
    } else if (role === 'patient') {
      const patient = new Patient({ firstName, lastName, email, password: hashedPassword, role });
      await patient.save();
    }
    res.status(201).send({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

export default router;