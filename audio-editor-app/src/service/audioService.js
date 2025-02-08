// src/services/audioService.js
import axiosInstance from './axiosInstance';

//TODO: Write the requset to backend
//Examples
const audioService = {
  uploadTrack: async (file) => {
    
      const response = await axiosInstance.post('/audio/uploadAudio', file, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
  },
mergeTracks: async (blobs) => {
    const formData = new FormData();

    blobs.forEach((blob, index) => {
      const convertedFile = 
      blob instanceof File 
      ? blob
      : new File([blob],`track_${index}.webm`, { type: blob.type || 'audio/webm' });
      formData.append('files', convertedFile); // Use 'files' as the part name
    });

    try {
      const response = await axiosInstance.post('/audio/mergeTracks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Error merging tracks:', error);
      throw error;
    }
  },

  fetchTracks: async () => {
    try {
      const response = await axiosInstance.get('/tracks');
      return response.data;
    } catch (error) {
      console.error('Error fetching tracks:', error);
      throw error;
    }
  },
};

export default audioService;
