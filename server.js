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

// Allowed origins for CORS
const allowedOrigins = [
  'https://medical-webpage-front.vercel.app', 
  'https://login-doctor-patient.vercel.app', 
  'https://medical-webpage-signup-aafo.vercel.app',
];

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
}));

// Middleware to set CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Handle preflight requests explicitly (OPTIONS method)
app.options('*', cors());

const JWT_SECRET = process.env.JWT_SECRET;
console.log('JWT_SECRET:', JWT_SECRET);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Base route for health check
app.get('/', (_, res) => {
  res.json({
    status: 'Backend is running!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
  });
});

// API routes
app.use('/api', signupRouter);
app.use('/api', loginRouter);
app.use('/api/patients', patientsRoutes);
// Add other routes as needed

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof Error) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
