import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import signupRouter from './routes/signup.js';
import loginRouter from './routes/login.js';
import cors from 'cors';

dotenv.config();

const app = express();
const allowedOrigins = [
  'https://medical-webpage-front.vercel.app/',
  'https://medical-webpage-signup-aafo.vercel.app/',
  'https://medical-webpage-signin.vercel.app/',
  'https://patient-dashboard-pink.vercel.app/',
  'https://docotr-dashboard.vercel.app/'
];

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));