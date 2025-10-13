import axios from 'axios';

export const generateCv = async (formData) => {
  const response = await axios.post('/api/generate-cv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
  });
  return response.data;
};
