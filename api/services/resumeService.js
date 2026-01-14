const prisma = require('../config/database');

// Get all resumes
exports.getResumes = async () => {
  return prisma.resume.findMany();
};

// Get a single resume
exports.getResume = async (id) => {
  return prisma.resume.findUnique({
    where: {
      id: parseInt(id),
    },
  });
};

// Create a resume
exports.createResume = async (data) => {
  return prisma.resume.create({
    data,
  });
};

// Update a resume
exports.updateResume = async (id, data) => {
  return prisma.resume.update({
    where: {
      id: parseInt(id),
    },
    data,
  });
};

// Delete a resume
exports.deleteResume = async (id) => {
  return prisma.resume.delete({
    where: {
      id: parseInt(id),
    },
  });
};
