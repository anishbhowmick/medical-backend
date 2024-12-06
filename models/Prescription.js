import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  medication: {
    type: String,
    required: true,
  },
  dosage: {
    type: String,
    required: true,
  },
  instructions: {
    type: String,
    required: true,
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Prescription = mongoose.model('Prescription', prescriptionSchema); 