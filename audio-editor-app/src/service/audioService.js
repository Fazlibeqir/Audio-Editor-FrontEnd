// src/services/audioService.js
import axiosInstance from './axiosInstance';

//TODO: Write the requset to backend
//Examples
const audioService = {
  uploadTrack: async (file) => {
    try {

      const response = await axiosInstance.post('/audio/uploadAudio', file, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading track:', error);
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
