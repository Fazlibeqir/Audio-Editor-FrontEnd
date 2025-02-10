import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://audio-editor-backend.onrender.com', // TODO: Hosting the backEnd!
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
});

export default axiosInstance;
