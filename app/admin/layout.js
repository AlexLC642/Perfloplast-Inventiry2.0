'use client';
import { usePathname } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar';
import GPSGuard from '../../components/GPSGuard';
import { SessionProvider } from 'next-auth/react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <SessionProvider>{children}</SessionProvider>;
  }

  return (
    <SessionProvider>
      <GPSGuard>
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
          <AdminSidebar />
          <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
            {children}
          </main>
        </div>
      </GPSGuard>
    </SessionProvider>
  );
}
