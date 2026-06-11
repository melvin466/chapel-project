import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Hook to monitor connection to the Chapel System backend API.
 * Uses a lightweight request to the health endpoint.
 */
export function useOffline() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let active = true;

    const checkConnection = async () => {
      try {
        // Send a fast health check request
        await api.get('/health', {
          timeout: 4000,
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (active) {
          setIsOffline(false);
        }
      } catch (error: any) {
        // If there's no response or it's a network error, mark as offline
        if (active && (!error.response || error.code === 'ECONNABORTED' || error.message.includes('Network Error'))) {
          setIsOffline(true);
        }
      }
    };

    // Initial check
    checkConnection();

    // Check periodically every 15 seconds
    const interval = setInterval(checkConnection, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return isOffline;
}

export default useOffline;
