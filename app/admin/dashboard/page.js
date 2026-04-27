'use client';
import { motion } from 'framer-motion';

const STATS = [
  { label: 'Productos en Catálogo', value: '23', icon: '🎨', color: '#c5a059' },
  { label: 'Stock Crítico', value: '5', icon: '⚠️', color: '#ef4444' },
  { label: 'Ventas del Mes', value: '$12,450', icon: '💰', color: '#10b981' },
  { label: 'Despachos Pendientes', value: '8', icon: '🚚', color: '#3b82f6' },
];

import { SalesTrendChart, InventoryDistribution, ProductionByShift } from '../../../components/DashboardCharts';

const SALES_DATA = [
  { name: 'Ene', ventas: 4000 },
  { name: 'Feb', ventas: 3000 },
  { name: 'Mar', ventas: 5000 },
  { name: 'Abr', ventas: 8000 },
  { name: 'May', ventas: 6000 },
];

const INV_DATA = [
  { name: 'PVC', value: 400 },
  { name: 'HDPE', value: 300 },
  { name: 'Masterbatch', value: 200 },
  { name: 'Empaque', value: 100 },
];

const PROD_DATA = [
  { name: 'Mañana', cantidad: 1200 },
  { name: 'Tarde', cantidad: 950 },
  { name: 'Noche', cantidad: 600 },
];

export default function AdminDashboard() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1a1a1b', marginBottom: '8px' }}>
          Bienvenido, Administrador
        </h1>
        <p style={{ color: '#64748b' }}>Vista general de las operaciones de Perflo-Plast.</p>
      </header>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '24px',
        marginBottom: '48px'
      }}>
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{
              padding: '32px',
              background: 'white',
              borderRadius: '24px',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '14px', 
              background: `${stat.color}10`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>{stat.label}</p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1b' }}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <SalesTrendChart data={SALES_DATA} />
        <InventoryDistribution data={INV_DATA} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <ProductionByShift data={PROD_DATA} />
        <div style={{ 
          background: 'white', 
          borderRadius: '24px', 
          border: '1px solid rgba(0,0,0,0.05)', 
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#c5a059',
          fontWeight: '700'
        }}>
          Tabla de Stock por Ubicación (Próximamente)
        </div>
      </div>
    </div>
  );
}
