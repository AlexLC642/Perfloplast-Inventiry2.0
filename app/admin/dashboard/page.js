'use client';
import { motion } from 'framer-motion';

const STATS = [
  { label: 'Productos en Catálogo', value: '23', icon: '🎨', color: '#c5a059' },
  { label: 'Ajustes Visuales Guardados', value: '18', icon: '✨', color: '#10b981' },
];

export default function AdminDashboard() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1a1a1b', marginBottom: '8px' }}>
          Bienvenido, Administrador
        </h1>
        <p style={{ color: '#64748b' }}>Gestión Premium del Catálogo de Perflo-Plast.</p>
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

      <div style={{ 
        background: 'rgba(197, 160, 89, 0.05)', 
        borderRadius: '32px', 
        padding: '48px', 
        textAlign: 'center',
        border: '1px dashed rgba(197, 160, 89, 0.2)'
      }}>
        <p style={{ fontSize: '18px', fontWeight: '600', color: '#c5a059', marginBottom: '16px' }}>
          Sistema de Edición Premium Activo
        </p>
        <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          Utiliza el editor de catálogo para ajustar máscaras, colores, brillos y sombras de tus productos. 
          Todos los cambios se sincronizan automáticamente con la visualización del cliente.
        </p>
      </div>
    </div>
  );
}
