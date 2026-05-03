'use client';
import { motion } from 'framer-motion';

const STEPS = [
  { id: 1, title: 'Carga de Productos', desc: 'Sube la imagen base de tu producto (ej. Silla Blanca). Asegúrate de que el fondo sea liso para mejores resultados.', icon: '📸' },
  { id: 2, title: 'Estudio de Color', desc: 'Usa el editor premium para ajustar el brillo y las sombras. Puedes crear variantes de color ilimitadas.', icon: '🎨' },
  { id: 3, title: 'Configuración Global', desc: 'En Ajustes, cambia el fondo de mármol o la escena general para que todo el catálogo se vea uniforme.', icon: '⚙️' },
  { id: 4, title: 'Sincronización', desc: 'Todos los cambios se guardan en la nube y se reflejan instantáneamente en el catálogo del cliente.', icon: '☁️' },
];

export default function AdminDashboard() {
  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '40px 24px',
      background: 'url("https://res.cloudinary.com/dlp8m8vst/image/upload/v1713110291/Perfloplast/bg-marble_u8v6v6.jpg")',
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      borderRadius: '32px'
    }}>
      <header style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#1a1a1b', marginBottom: '12px', letterSpacing: '-0.02em' }}>
          Panel de Control Administrativo
        </h1>
        <p style={{ color: '#64748b', fontSize: '18px' }}>Bienvenido al sistema de gestión premium de Perflo-Plast.</p>
      </header>

      {/* Quick Access */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '64px' }}>
        <motion.div 
          whileHover={{ y: -5 }}
          style={{ background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid rgba(197, 160, 89, 0.1)' }}
        >
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚀</div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Acceso Rápido</h3>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>Empieza a editar tus productos ahora mismo.</p>
          <a href="/admin/catalog" style={{ display: 'inline-block', background: '#1a1a1b', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', textDecoration: 'none' }}>
            Ir al Catálogo
          </a>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          style={{ background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid rgba(197, 160, 89, 0.1)' }}
        >
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>👁️‍🗨️</div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Vista Pública</h3>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>Mira cómo los clientes ven tus productos.</p>
          <a href="/" target="_blank" style={{ display: 'inline-block', border: '2px solid #1a1a1b', color: '#1a1a1b', padding: '10px 24px', borderRadius: '12px', fontWeight: '700', textDecoration: 'none' }}>
            Ver Catálogo Real
          </a>
        </motion.div>
      </div>

      {/* Usage Instructions */}
      <section style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', padding: '48px', borderRadius: '32px', border: '1px solid white' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '32px', textAlign: 'center' }}>¿Cómo usar tu Panel Premium?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px' }}>
          {STEPS.map((step) => (
            <div key={step.id} style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                background: 'white', 
                borderRadius: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '28px', 
                margin: '0 auto 20px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
              }}>
                {step.icon}
              </div>
              <h4 style={{ fontWeight: '800', marginBottom: '12px', fontSize: '16px' }}>{step.id}. {step.title}</h4>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ marginTop: '64px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
        Perflo-Plast © 2026 | Sistema de Catálogo Master Premium
      </footer>
    </div>
  );
}
