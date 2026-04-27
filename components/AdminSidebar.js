'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Panel General', icon: '📊', path: '/admin/dashboard' },
  { id: 'catalog', label: 'Catálogo Maestro', icon: '🎨', path: '/admin/catalog' },
  { id: 'inventory', label: 'Inventario', icon: '📦', path: '/admin/inventory' },
  { id: 'production', label: 'Producción', icon: '🏭', path: '/admin/production' },
  { id: 'sales', label: 'Ventas y Pedidos', icon: '💰', path: '/admin/sales' },
  { id: 'logistics', label: 'Logística', icon: '🚚', path: '/admin/logistics' },
  { id: 'users', label: 'Configuración', icon: '⚙️', path: '/admin/settings' },
];

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? '80px' : '280px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        height: '100vh',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(197, 160, 89, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ minWidth: '40px' }}>
          <Logo height={40} />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              style={{ flex: 1 }}
            >
              <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a1b', margin: 0, letterSpacing: '-0.02em' }}>
                Perflo-Plast
              </h1>
              <p style={{ fontSize: '10px', color: '#c5a059', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' }}>
                Inventory 2.0
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {MENU_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link key={item.id} href={item.path} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ x: 4, background: 'rgba(197, 160, 89, 0.05)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: isActive ? 'linear-gradient(135deg, #1a1a1b 0%, #334155 100%)' : 'transparent',
                  color: isActive ? 'white' : '#64748b',
                  cursor: 'pointer',
                  transition: 'color 0.3s ease',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ fontSize: '14px', fontWeight: isActive ? '600' : '500', whiteSpace: 'nowrap' }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && !isCollapsed && (
                  <motion.div
                    layoutId="active-pill"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#c5a059'
                    }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile Area */}
      <div style={{ padding: '24px', borderTop: '1px solid rgba(197, 160, 89, 0.05)' }}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(197, 160, 89, 0.1)',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '12px',
            color: '#c5a059'
          }}
        >
          <span style={{ fontSize: '18px' }}>{isCollapsed ? '➡️' : '⬅️'}</span>
          {!isCollapsed && <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Colapsar</span>}
        </button>
      </div>
    </motion.aside>
  );
}
