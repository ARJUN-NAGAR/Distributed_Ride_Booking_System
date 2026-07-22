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
    // Suppress global toast popups for automated DDoS load tests
    const isDdosTest = error.config?.headers?.['X-DDoS-Test'] === 'true';
    if (isDdosTest) {
      return Promise.reject(error);
    }

    if (!error.response) {
      toast.error('📡 Location Service unreachable', { id: 'location-service-unreachable' });
    } else if (error.response.status === 404) {
      toast.error('Location not found', { id: 'location-not-found' });
    } else if (error.response.status >= 500) {
      toast.error('Location Service error — check service logs', { id: 'location-service-500' });
    }
    return Promise.reject(error);
  }
);

export default axiosLocationClient;
