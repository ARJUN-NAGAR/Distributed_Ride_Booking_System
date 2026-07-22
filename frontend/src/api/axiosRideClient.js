import axios from 'axios';
import toast from 'react-hot-toast';

const axiosRideClient = axios.create({
  baseURL: import.meta.env.VITE_RIDE_SERVICE_URL || 'http://localhost:8083',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

axiosRideClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosRideClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error('📡 Ride Service unreachable', { id: 'ride-service-unreachable' });
    } else if (error.response.status === 404) {
      toast.error('Ride not found — check the Ride ID', { id: 'ride-not-found' });
    } else if (error.response.status >= 500) {
      toast.error('Ride Service error — check service logs', { id: 'ride-service-500' });
    }
    return Promise.reject(error);
  }
);

export default axiosRideClient;
