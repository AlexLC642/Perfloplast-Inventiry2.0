'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

const MODULES = [
  { title: 'Almacenes', description: 'Gestiona ubicaciones físicas', path: '/admin/inventory/warehouses', icon: '🏢' },
  { title: 'Productos', description: 'Stock y variantes', path: '/admin/catalog', icon: '📦' },
  { title: 'Movimientos', description: 'Entradas y salidas', path: '/admin/inventory/movements', icon: '🔄' },
];

export default function InventoryIndex() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1a1a1b', marginBottom: '8px' }}>Módulo de Inventario</h1>
        <p style={{ color: '#64748b' }}>Control total sobre tus existencias y ubicaciones.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {MODULES.map((m, i) => (
          <Link key={m.path} href={m.path} style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
              style={{
                padding: '40px',
                background: 'white',
                borderRadius: '32px',
                border: '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '40px' }}>{m.icon}</div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1b', marginBottom: '8px' }}>{m.title}</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>{m.description}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
