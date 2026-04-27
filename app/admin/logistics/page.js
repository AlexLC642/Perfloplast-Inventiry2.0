'use client';
import { motion } from 'framer-motion';

export default function LogisticsPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1a1a1b', marginBottom: '8px' }}>Logística y Despachos</h1>
        <p style={{ color: '#64748b' }}>Seguimiento de camiones y rutas de entrega.</p>
      </header>

      <div style={{ background: 'white', borderRadius: '32px', padding: '48px', border: '1px solid rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#64748b' }}>Módulo de Logística (En desarrollo para replicar DispatchResource)</p>
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <span style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>GPS TRACKING</span>
          <span style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>RUTAS</span>
          <span style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>CAMIONES</span>
        </div>
      </div>
    </div>
  );
}
