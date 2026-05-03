'use client';
import { motion } from 'framer-motion';
import Logo from './Logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNavbar() {
  const pathname = usePathname();

  const NAV_ITEMS = [
    { label: 'Panel General', path: '/admin/dashboard', icon: '📊' },
    { label: 'Inventario', path: '/admin/catalog', icon: '🎨' },
    { label: 'Configuración', path: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(25px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
      padding: '8px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 4px 30px rgba(0,0,0,0.02)'
    }}>
      <Link href="/admin/dashboard" style={{ textDecoration: 'none' }}>
        <Logo size={40} showIcon={true} />
      </Link>

      <div style={{ display: 'flex', gap: '8px' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  background: isActive ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'transparent',
                  color: isActive ? 'white' : '#475569',
                  fontWeight: '700',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <span>{item.icon}</span>
                <span style={{ display: 'inline-block' }}>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <Link href="/" target="_blank" style={{
          padding: '10px 18px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          color: '#64748b',
          fontSize: '13px',
          fontWeight: '600',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          Ver Catálogo ↗
        </Link>
      </div>
    </nav>
  );
}
