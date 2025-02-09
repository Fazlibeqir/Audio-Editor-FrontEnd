import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080', // TODO: Hosting the backEnd!
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
});

export default axiosInstance;
