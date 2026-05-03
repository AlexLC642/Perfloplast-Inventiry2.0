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
        <div style={{ 
          display: 'flex', 
          minHeight: '100vh', 
          background: 'url("https://res.cloudinary.com/dlp8m8vst/image/upload/v1713110291/Perfloplast/bg-marble_u8v6v6.jpg")',
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed'
        }}>
          <AdminSidebar />
          <main style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
            {children}
          </main>
        </div>
      </GPSGuard>
    </SessionProvider>
  );
}
