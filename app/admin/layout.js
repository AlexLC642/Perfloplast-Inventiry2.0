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
        <div style={{ position: 'relative', display: 'flex', minHeight: '100vh' }}>
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
