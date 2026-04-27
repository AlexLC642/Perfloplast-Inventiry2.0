'use client';
import { motion } from 'framer-motion';

export default function ProductionPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1a1a1b', marginBottom: '8px' }}>Módulo de Producción</h1>
        <p style={{ color: '#64748b' }}>Reportes de inyección y control de turnos.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)' }}
        >
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Reportes de Inyección</h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Registro diario de piezas producidas por máquina.</p>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)' }}
        >
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Control de Turnos</h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Gestión de personal en planta.</p>
        </motion.div>
      </div>
    </div>
  );
}
