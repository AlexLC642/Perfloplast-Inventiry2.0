'use client';
import { usePathname } from 'next/navigation';
import AdminNavbar from '../../components/AdminNavbar';
import GPSGuard from '../../components/GPSGuard';
import { SessionProvider } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <SessionProvider>{children}</SessionProvider>;
  }

  return (
    <SessionProvider>
      <GPSGuard>
        <div style={{ position: 'relative', display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
          {/* Premium Animated Background */}
          <motion.div 
            initial={{ scale: 1.1, x: -20 }}
            animate={{ 
              x: [0, -40, 0],
              y: [0, -20, 0],
              rotate: [0, 0.5, 0]
            }}
            transition={{ 
              duration: 30, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            style={{ 
              position: 'absolute',
              top: '-10%',
              left: '-10%',
              width: '120%',
              height: '120%',
              background: 'url("https://res.cloudinary.com/dlp8m8vst/image/upload/v1713110291/Perfloplast/bg-marble_u8v6v6.jpg")',
              backgroundSize: 'cover',
              zIndex: 0,
              opacity: 0.8
            }}
          />

          {/* Content Layer */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', minHeight: '100vh' }}>
            <AdminNavbar />
            <main style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
              {children}
            </main>
          </div>
        </div>
      </GPSGuard>
    </SessionProvider>
  );
}
