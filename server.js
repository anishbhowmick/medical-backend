import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import signupRouter from './routes/signup.js';
import loginRouter from './routes/login.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import patientsRoutes from './routes/patients.js';
// Import other routes as needed

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

// Configure CORS to allow credentials and specify the frontend origin
app.use(cors({
  origin: 'https://login-doctor-patient.vercel.app/',
  origin: 'https://medical-webpage-front.vercel.app/',
  origin: 'https://medical-webpage-signup-aafo.vercel.app/',
  credentials: true,
}));

const JWT_SECRET = process.env.JWT_SECRET;
console.log('JWT_SECRET:', JWT_SECRET);

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

app.get('/', (_, res) => {
  res.json({
    status: 'Backend is running!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
  });
});

app.use('/api', signupRouter);
app.use('/api', loginRouter);
app.use('/api/patients', patientsRoutes);
// Add other routes as needed

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

