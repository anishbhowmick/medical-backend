import express from 'express';
import { Patient } from '../models/User.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import authenticate from '../middleware/authenticate.js';

dotenv.config();

const router = express.Router();

// Apply authentication middleware to all routes below
router.use(authenticate);

// Route to search patients by first name, last name, or ID without authentication
router.get('/search', async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === '') {
    return res.status(400).send({ error: 'Search query is required' });
  }

  try {
    // Initialize the $or conditions with firstName and lastName
    const orConditions = [
      { firstName: { $regex: query, $options: 'i' } },
      { lastName: { $regex: query, $options: 'i' } },
    ];

    // If the query is a valid ObjectId, include it in the search
    if (mongoose.Types.ObjectId.isValid(query)) {
      orConditions.push({ _id: query });
    }

    // Perform the search with the constructed $or conditions
    const patients = await Patient.find({
      $or: orConditions,
    }).populate('treatmentInfo'); // Ensure treatmentInfo is populated

    // Map patients to include lastUpdated
    const mappedPatients = patients.map(patient => ({
      _id: patient._id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      lastVisit: patient.lastVisit,
      lastUpdated: patient.treatmentInfo?.lastUpdated || null, // Extract lastUpdated
      status: patient.status,
      // Add other relevant fields
    }));

    res.status(200).send({ patients: mappedPatients });
  } catch (error) {
    console.error('Error searching for patients:', error);
    res.status(500).send({ error: 'Server error while searching for patients' });
  }
});

// Route to update patient details including Treatment Information
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const {
    bloodPressure,
    heartRate,
    bloodSugar,
    weight,
    height,
    firstName,
    lastName,
    lastVisit,
    status,
    age,
    gender,
    bloodGroup,
    primaryContact,
    emergencyContact,
    currentDiagnosis, // Treatment Information
  } = req.body;
  
  const userRole = req.user.role; // 'doctor' or 'patient'

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: 'Invalid patient ID' });
  }

  try {
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    // Check permissions
    if (userRole === 'patient' && req.user.id !== id) {
      return res.status(403).send({ error: 'Unauthorized to update this patient' });
    }

    // Prepare update data
    let updateData = {};

    if (userRole === 'doctor') {
      // Doctors can update comprehensive patient info
      updateData = {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        lastVisit: lastVisit || undefined,
        status: status || undefined,
        age: age || undefined,
        gender: gender || undefined,
        bloodGroup: bloodGroup || undefined,
        primaryContact: primaryContact || undefined,
        emergencyContact: emergencyContact || undefined,
        // Treatment Information
        'treatmentInfo.currentDiagnosis': currentDiagnosis || undefined,
        'treatmentInfo.lastUpdated': currentDiagnosis ? new Date() : undefined,
        // Add other fields as needed
      };
    }

    // Handle vitals update
    if (bloodPressure && heartRate && bloodSugar && weight && height) {
      // Parse bloodPressure if necessary
      // Assuming bloodPressure is in the format "systolic/diastolic mmHg"
      const [systolicStr, diastolicWithUnit] = bloodPressure.split('/');
      const systolic = parseInt(systolicStr, 10);
      const diastolic = parseInt(diastolicWithUnit, 10);

      if (isNaN(systolic) || isNaN(diastolic)) {
        return res.status(400).send({ error: 'Invalid blood pressure format' });
      }

      // Create a new vitals entry
      const newVitals = {
        systolic,
        diastolic,
        sugar: bloodSugar,
      };

      patient.vitals.push(newVitals);

      // Update current vitals
      updateData.bloodPressure = bloodPressure;
      updateData.heartRate = heartRate;
      updateData.bloodSugar = bloodSugar;
      updateData.weight = weight;
      updateData.height = height;
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    // Update patient details
    const updatedPatient = await Patient.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedPatient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    res.status(200).send({ message: 'Patient details updated successfully', patient: updatedPatient });
  } catch (error) {
    console.error('Error updating patient details:', error);
    res.status(400).send({ error: error.message });
  }
});

// Route to get patient details by ID
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: 'Invalid patient ID' });
  }

  try {
    const patient = await Patient.findById(id).select('-password');

    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    // Check if the user is authorized to access this patient's data
    if (req.user.role !== 'doctor' && req.user.id !== id) {
      return res.status(403).send({ error: 'Unauthorized access' });
    }

    res.status(200).send({ patient });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).send({ error: 'Server error while fetching patient details' });
  }
});

// Route to update patient details by ID
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: 'Invalid patient ID' });
  }

  try {
    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedPatient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    res.status(200).send({ message: 'Patient details updated successfully', patient: updatedPatient });
  } catch (error) {
    console.error('Error updating patient details:', error);
    res.status(400).send({ error: error.message });
  }
});

// GET /api/patients/:id/vitals
router.get('/:id/vitals', authenticate, async (req, res) => {
  const { id } = req.params;

  // Validate patient ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: 'Invalid patient ID' });
  }

  try {
    // Fetch patient data
    const patient = await Patient.findById(id).select('vitals');

    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    // Assume 'vitals' is an array of vitals entries in the Patient model
    if (!patient.vitals || patient.vitals.length === 0) {
      return res.status(200).send({ vitals: [] });
    }

    // Map vitals to the required format
    const vitalsData = patient.vitals.map((vital) => ({
      date: vital.date.toISOString().split('T')[0],
      systolic: vital.systolic,
      diastolic: vital.diastolic,
      sugar: vital.sugar,
      timestamp: vital.date.toISOString(),
    }));

    // Sort vitals by date descending
    vitalsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.status(200).send({ vitals: vitalsData });
  } catch (error) {
    console.error('Error fetching vitals data:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Route to add a prescription to a patient
router.post('/:id/prescriptions', async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role; // 'doctor' or 'patient'

  if (userRole !== 'doctor') {
    return res.status(403).send({ error: 'Only doctors can add prescriptions' });
  }

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: 'Invalid patient ID' });
  }

  const { medicine, dosage, timing, frequency, instructions, times } = req.body;

  // Validate required fields
  if (!medicine || !dosage || !timing || !frequency || !times || !Array.isArray(times) || times.length === 0) {
    return res.status(400).send({ error: 'Please provide all required fields, including at least one time.' });
  }

  // Validate each time string (Basic validation for "HH:MM" format)
  const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
  for (const time of times) {
    if (!timeRegex.test(time)) {
      return res.status(400).send({ error: `Invalid time format: ${time}. Expected "HH:MM".` });
    }
  }

  try {
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    const newPrescription = {
      medicine,
      dosage,
      timing,
      frequency,
      instructions,
      times,
    };

    patient.prescriptions.push(newPrescription);
    await patient.save();

    res.status(201).send({ message: 'Prescription added successfully', prescription: newPrescription });
  } catch (error) {
    console.error('Error adding prescription:', error);
    res.status(500).send({ error: 'Server error while adding prescription' });
  }
});

// Route to get all prescriptions of a patient
router.get('/:id/prescriptions', async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: 'Invalid patient ID' });
  }

  try {
    const patient = await Patient.findById(id).select('prescriptions');

    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    res.status(200).send({ prescriptions: patient.prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).send({ error: 'Server error while fetching prescriptions' });
  }
});

// Route to delete a prescription from a patient
router.delete('/:id/prescriptions/:prescriptionId', async (req, res) => {
  const { id, prescriptionId } = req.params;
  const userRole = req.user.role; // 'doctor' or 'patient'

  if (userRole !== 'doctor') {
    return res.status(403).send({ error: 'Only doctors can delete prescriptions' });
  }

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(prescriptionId)) {
    return res.status(400).send({ error: 'Invalid ID(s)' });
  }

  try {
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    const prescriptionIndex = patient.prescriptions.findIndex(
      (p) => p._id.toString() === prescriptionId
    );

    if (prescriptionIndex === -1) {
      return res.status(404).send({ error: 'Prescription not found' });
    }

    // Remove the prescription from the array
    patient.prescriptions.splice(prescriptionIndex, 1);
    await patient.save();

    res.status(200).send({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).send({ error: 'Server error while deleting prescription' });
  }
});

// NEW ROUTE: Add a new vitals entry
// POST /api/patients/:id/vitals
router.post('/:id/vitals', async (req, res) => {
  const { id } = req.params;
  const { systolic, diastolic, sugar } = req.body;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: 'Invalid patient ID' });
  }

  // Validate vitals data
  if (
    typeof systolic !== 'number' ||
    typeof diastolic !== 'number' ||
    typeof sugar !== 'number'
  ) {
    return res.status(400).send({ error: 'Invalid vitals data' });
  }

  try {
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    // Create a new vitals entry
    const newVitals = {
      systolic,
      diastolic,
      sugar,
    };

    // Append to the vitals array
    patient.vitals.push(newVitals);

    // Optionally, update current vitals
    patient.bloodPressure = `${systolic}/${diastolic} mmHg`;
    patient.bloodSugar = sugar;

    await patient.save();

    res.status(201).send({ message: 'Vitals added successfully', vitals: newVitals });
  } catch (error) {
    console.error('Error adding vitals:', error);
    res.status(500).send({ error: 'Server error while adding vitals' });
  }
});

// NEW ROUTE: Get all medical histories of a patient
// GET /api/patients/:id/histories
router.get('/:id/histories', async (req, res) => {
  const { id } = req.params;

  // Validate patient ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: 'Invalid patient ID' });
  }

  try {
    const patient = await Patient.findById(id).select('histories');

    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    // Check authorization: Only doctors or the patient themselves can view histories
    if (req.user.role !== 'doctor' && req.user.id !== id) {
      return res.status(403).send({ error: 'Unauthorized access' });
    }

    res.status(200).send({ histories: patient.histories });
  } catch (error) {
    console.error('Error fetching medical histories:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// NEW ROUTE: Add a new medical history to a patient
// POST /api/patients/:id/histories
router.post('/:id/histories', async (req, res) => {
  const { id } = req.params;
  const { condition, year } = req.body;
  const userRole = req.user.role; // 'doctor' or 'patient'

  // Only doctors can add medical histories
  if (userRole !== 'doctor') {
    return res.status(403).send({ error: 'Only doctors can add medical histories' });
  }

  // Validate patient ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: 'Invalid patient ID' });
  }

  // Validate request body
  if (!condition || condition.trim() === '') {
    return res.status(400).send({ error: 'Condition is required' });
  }

  try {
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    const newHistory = {
      condition: condition.trim(),
      year: year ? year.trim() : undefined,
    };

    patient.histories.push(newHistory);
    await patient.save();

    res.status(201).send({ message: 'Medical history added successfully', history: newHistory });
  } catch (error) {
    console.error('Error adding medical history:', error);
    res.status(500).send({ error: 'Server error while adding medical history' });
  }
});

// NEW ROUTE: Delete a medical history from a patient
// DELETE /api/patients/:id/histories/:historyId
router.delete('/:id/histories/:historyId', async (req, res) => {
  const { id, historyId } = req.params;
  const userRole = req.user.role; // 'doctor' or 'patient'

  // Only doctors can delete medical histories
  if (userRole !== 'doctor') {
    return res.status(403).send({ error: 'Only doctors can delete medical histories' });
  }

  // Validate patient ID and history ID
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(historyId)) {
    return res.status(400).send({ error: 'Invalid ID(s)' });
  }

  try {
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    const historyIndex = patient.histories.findIndex(
      (h) => h._id.toString() === historyId
    );

    if (historyIndex === -1) {
      return res.status(404).send({ error: 'Medical history not found' });
    }

    patient.histories.splice(historyIndex, 1);
    await patient.save();

    res.status(200).send({ message: 'Medical history deleted successfully' });
  } catch (error) {
    console.error('Error deleting medical history:', error);
    res.status(500).send({ error: 'Server error while deleting medical history' });
  }
});

// NEW ROUTE: Get all allergies of a patient
// GET /api/patients/:id/allergies
router.get('/:id/allergies', async (req, res) => {
  const { id } = req.params;

  // Validate patient ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: 'Invalid patient ID' });
  }

  try {
    const patient = await Patient.findById(id).select('allergies');

    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    // Check authorization: Only doctors or the patient themselves can view allergies
    if (req.user.role !== 'doctor' && req.user.id !== id) {
      return res.status(403).send({ error: 'Unauthorized access' });
    }

    res.status(200).send({ allergies: patient.allergies });
  } catch (error) {
    console.error('Error fetching allergies:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// NEW ROUTE: Add a new allergy to a patient
// POST /api/patients/:id/allergies
router.post('/:id/allergies', async (req, res) => {
  const { id } = req.params;
  const { name, severity } = req.body;
  const userRole = req.user.role; // 'doctor' or 'patient'

  // Only doctors can add allergies
  if (userRole !== 'doctor') {
    return res.status(403).send({ error: 'Only doctors can add allergies' });
  }

  // Validate patient ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: 'Invalid patient ID' });
  }

  // Validate request body
  if (!name || name.trim() === '') {
    return res.status(400).send({ error: 'Allergy name is required' });
  }

  if (!['High', 'Medium', 'Low'].includes(severity)) {
    return res.status(400).send({ error: 'Invalid severity level' });
  }

  try {
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    const newAllergy = {
      name: name.trim(),
      severity,
    };

    patient.allergies.push(newAllergy);
    await patient.save();

    res.status(201).send({ message: 'Allergy added successfully', allergy: newAllergy });
  } catch (error) {
    console.error('Error adding allergy:', error);
    res.status(500).send({ error: 'Server error while adding allergy' });
  }
});

// NEW ROUTE: Delete an allergy from a patient
// DELETE /api/patients/:id/allergies/:allergyId
router.delete('/:id/allergies/:allergyId', async (req, res) => {
  const { id, allergyId } = req.params;
  const userRole = req.user.role; // 'doctor' or 'patient'

  // Only doctors can delete allergies
  if (userRole !== 'doctor') {
    return res.status(403).send({ error: 'Only doctors can delete allergies' });
  }

  // Validate patient ID and allergy ID
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(allergyId)) {
    return res.status(400).send({ error: 'Invalid ID(s)' });
  }

  try {
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    const allergyIndex = patient.allergies.findIndex(
      (a) => a._id.toString() === allergyId
    );

    if (allergyIndex === -1) {
      return res.status(404).send({ error: 'Allergy not found' });
    }

    patient.allergies.splice(allergyIndex, 1);
    await patient.save();

    res.status(200).send({ message: 'Allergy deleted successfully' });
  } catch (error) {
    console.error('Error deleting allergy:', error);
    res.status(500).send({ error: 'Server error while deleting allergy' });
  }
});

export default router;
