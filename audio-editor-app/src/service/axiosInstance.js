import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080', // TODO:update with our API URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
