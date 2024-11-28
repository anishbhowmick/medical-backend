import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['doctor', 'patient'] },
});

export const Doctor = mongoose.model('Doctor', userSchema);
export const Patient = mongoose.model('Patient', userSchema);