import axios from 'axios';
import toast from 'react-hot-toast';

const axiosLocationClient = axios.create({
  baseURL: import.meta.env.VITE_LOCATION_SERVICE_URL || 'http://localhost:8082',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

axiosLocationClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosLocationClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error('📡 Location Service unreachable');
    } else if (error.response.status === 404) {
      toast.error('Location not found');
    } else if (error.response.status >= 500) {
      toast.error('Location Service error — check service logs');
    }
    return Promise.reject(error);
  }
);

export default axiosLocationClient;
