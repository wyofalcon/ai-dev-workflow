const prisma = require('../config/database');
const {
  getResume,
  getResumes,
  createResume,
  updateResume,
  deleteResume,
} = require('../services/resumeService');

// Get all resumes
exports.getResumes = async (req, res, next) => {
  try {
    const resumes = await getResumes();
    res.json(resumes);
  } catch (error) {
    next(error);
  }
};

// Get a single resume
exports.getResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resume = await getResume(id);
    res.json(resume);
  } catch (error) {
    next(error);
  }
};

// Create a resume
exports.createResume = async (req, res, next) => {
  try {
    const resume = await createResume(req.body);
    res.json(resume);
  } catch (error) {
    next(error);
  }
};

// Update a resume
exports.updateResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resume = await updateResume(id, req.body);
    res.json(resume);
  } catch (error) {
    next(error);
  }
};

// Delete a resume
exports.deleteResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteResume(id);
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    next(error);
  }
};
