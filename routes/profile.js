// import express from 'express';
// import { Doctor } from '../models/User.js';
// import jwt from 'jsonwebtoken';
// import dotenv from 'dotenv';

// dotenv.config();

// const router = express.Router();
// const JWT_SECRET = process.env.JWT_SECRET;

// // Middleware to authenticate and authorize doctor
// const authenticateDoctor = async (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];

//   if (!token) {
//     return res.status(401).send({ error: 'Authentication required' });
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);

//     if (decoded.role !== 'doctor') {
//       return res.status(403).send({ error: 'Access denied' });
//     }

//     req.doctorId = decoded.id;
//     next();
//   } catch (error) {
//     return res.status(401).send({ error: 'Invalid token' });
//   }
// };

// // Route to update doctor profile
// router.put('/profile/update', authenticateDoctor, async (req, res) => {
//   const { specialty, qualifications, experience, avatar } = req.body;

//   try {
//     const updatedDoctor = await Doctor.findByIdAndUpdate(
//       req.doctorId,
//       {
//         specialty,
//         qualifications,
//         experience,
//         avatar,
//       },
//       { new: true, runValidators: true }
//     ).select('-password'); // Exclude password from the returned data

//     if (!updatedDoctor) {
//       return res.status(404).send({ error: 'Doctor not found' });
//     }

//     res.status(200).send({ message: 'Profile updated successfully', user: updatedDoctor });
//   } catch (error) {
//     res.status(400).send({ error: error.message });
//   }
// });

// export default router; 