'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GPSGuard({ children }) {
  const { data: session } = useSession();
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Only enforce for Drivers and Sellers
    const rolesToEnforce = ['DRIVER', 'SELLER'];
    if (session?.user?.role && rolesToEnforce.includes(session.user.role)) {
      checkGPS();
    } else {
      setChecking(false);
    }
  }, [session]);

  const checkGPS = () => {
    if (!navigator.geolocation) {
      setGpsEnabled(false);
      setChecking(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setGpsEnabled(true);
        setChecking(false);
      },
      () => {
        setGpsEnabled(false);
        setChecking(false);
      }
    );
  };

  if (checking) return null;

  return (
    <>
      <AnimatePresence>
        {!gpsEnabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(26, 26, 27, 0.95)',
              backdropFilter: 'blur(10px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              textAlign: 'center',
              color: 'white'
            }}
          >
            <div style={{ maxWidth: '400px' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>📍</div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '16px' }}>GPS Obligatorio</h2>
              <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '32px' }}>
                Para continuar usando la App como {session?.user?.role}, es obligatorio activar el GPS. Esto asegura el seguimiento correcto de las rutas y ventas.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#c5a059',
                  border: 'none',
                  borderRadius: '16px',
                  color: 'white',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Reintentar / Activar GPS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {gpsEnabled && children}
    </>
  );
}
