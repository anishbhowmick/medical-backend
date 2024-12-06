import express from 'express';
import { Prescription } from '../models/Prescription.js';
import { Doctor, Patient } from '../models/User.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new prescription
router.post('/', authenticateToken, async (req, res) => {
  const { patientId, medication, dosage, instructions } = req.body;
  const doctorId = req.user.id;

  try {
    // Verify if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    // Create and save prescription
    const prescription = new Prescription({
      patientId,
      medication,
      dosage,
      instructions,
      issuedBy: doctorId,
    });

    await prescription.save();

    res.status(201).send({ message: 'Prescription added successfully', prescription });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Get prescriptions for a patient
router.get('/:patientId', authenticateToken, async (req, res) => {
  const { patientId } = req.params;

  try {
    // Verify if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    // Fetch prescriptions
    const prescriptions = await Prescription.find({ patientId }).populate('issuedBy', 'name');

    res.status(200).send({ prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

export default router; 