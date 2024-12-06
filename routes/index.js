import express from 'express';
import loginRoutes from './login.js';
import signupRoutes from './signup.js';
import prescriptionRoutes from './prescriptions.js'; // Import prescriptions routes

const router = express.Router();

router.use('/login', loginRoutes);
router.use('/signup', signupRoutes);
router.use('/prescriptions', prescriptionRoutes); // Use prescriptions routes

export default router; 