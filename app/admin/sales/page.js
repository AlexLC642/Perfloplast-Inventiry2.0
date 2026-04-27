'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function SalesPage() {
  const [sales, setSales] = useState([]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1a1a1b', marginBottom: '8px' }}>Ventas y Facturación</h1>
          <p style={{ color: '#64748b' }}>Gestión de comprobantes y flujo de caja.</p>
        </div>
        <button style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #1a1a1b 0%, #334155 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '14px',
          fontWeight: '700',
          cursor: 'pointer'
        }}>
          + Nueva Venta
        </button>
      </header>

      <div style={{ 
        height: '400px', 
        background: 'white', 
        borderRadius: '32px', 
        border: '1px solid rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b'
      }}>
        Listado de Ventas (En construcción para coincidir con Laravel)
      </div>
    </div>
  );
}
