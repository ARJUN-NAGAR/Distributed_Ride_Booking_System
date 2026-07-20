import { useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import RiderPortal from './pages/RiderPortal';
import DriverSimulator from './pages/DriverSimulator';
import OpsConsole from './pages/OpsConsole';

function App() {
  useEffect(() => {
    const fetchToken = async () => {
      try {
        // Authenticate with ride-service to get the shared JWT token
        const response = await axios.post(
          (import.meta.env.VITE_RIDE_SERVICE_URL || 'http://localhost:8083') + '/api/v1/auth/login',
          { username: 'passenger_500', role: 'ROLE_RIDER' }
        );
        localStorage.setItem('jwt_token', response.data.token);
        console.log('Successfully authenticated on startup');
      } catch (err) {
        console.error('Failed to authenticate on startup:', err);
      }
    };
    fetchToken();
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(225, 25%, 12%)',
            color: 'hsl(215, 30%, 92%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
          },
          success: {
            iconTheme: { primary: 'hsl(155, 70%, 50%)', secondary: 'white' },
          },
          error: {
            iconTheme: { primary: 'hsl(0, 75%, 55%)', secondary: 'white' },
          },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<RiderPortal />} />
          <Route path="/driver" element={<DriverSimulator />} />
          <Route path="/ops" element={<OpsConsole />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
