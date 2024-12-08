import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  medicine: { type: String, required: true },
  dosage: { type: String, required: true },
  timing: { type: String, enum: ['Before meals', 'After meals', 'With meals'], required: true },
  frequency: { type: Number, required: true },
  instructions: { type: String },
  times: { type: [String], required: true },
}, { timestamps: true });

// Define the schema for a single vitals entry
const vitalEntrySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  systolic: { type: Number, required: true },
  diastolic: { type: Number, required: true },
  sugar: { type: Number, required: true },
});

// Define the schema for a single treatment entry
const treatmentInfoSchema = new mongoose.Schema({
  currentDiagnosis: { type: String, default: '' },
  lastUpdated: { type: Date, default: null },
}, { timestamps: true });

// NEW: Define the schema for a single medical history entry
const historyItemSchema = new mongoose.Schema({
  condition: { type: String, required: true },
  year: { type: String },
}, { timestamps: true });

// NEW: Define the schema for a single allergy entry
const allergySchema = new mongoose.Schema({
  name: { type: String, required: true },
  severity: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['doctor', 'patient'], required: true },
  
  // Additional fields for Doctors
  specialty: { type: String }, // e.g., Cardiologist, Neurologist
  qualifications: { type: [String], default: [] }, // e.g., ['MD', 'FACC']
  experience: { type: Number, default: 0 }, // Years of experience
  avatar: { type: String }, // URL to avatar image
  
  // Additional fields for Patients
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup: { type: String },
  primaryContact: { type: String },
  emergencyContact: { type: String },
  lastVisit: { type: Date },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  
  // Current Vitals (Patients can update these)
  bloodPressure: { type: String }, // e.g., "120/80 mmHg"
  heartRate: { type: Number }, // beats per minute
  bloodSugar: { type: Number }, // mg/dL
  weight: { type: Number }, // kg
  height: { type: Number }, // cm
  
  // Vitals History
  vitals: { type: [vitalEntrySchema], default: [] }, // Array to store vitals history
  
  // Prescriptions
  prescriptions: { type: [prescriptionSchema], default: [] },
  
  // Treatment Information
  treatmentInfo: { type: treatmentInfoSchema, default: () => ({}) },
  
  // NEW: Medical Histories
  histories: { type: [historyItemSchema], default: [] },
  
  // NEW: Allergies
  allergies: { type: [allergySchema], default: [] },
}, { timestamps: true });

export const Doctor = mongoose.model('Doctor', userSchema);
export const Patient = mongoose.model('Patient', userSchema);
