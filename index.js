import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import signupRouter from './routes/signup.js';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

app.use('/api', signupRouter);
app.get('/', (_, res) => {
    res.json({
        status: 'Backend is running!',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));