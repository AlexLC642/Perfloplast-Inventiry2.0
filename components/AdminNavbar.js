'use client';
import Link from 'next/link';

export default function AdminNavbar() {
  return (
    <nav style={{ 
      padding: '16px 48px', 
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(197, 160, 89, 0.15)', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
    }}>
      <div style={{ 
        fontFamily: 'var(--font-display)',
        fontSize: '14px', 
        fontWeight: '800', 
        letterSpacing: '0.15em', 
        color: '#1a1a1b' 
      }}>
        PERFLO-PLAST <span style={{ color: '#c5a059' }}>ADMIN</span>
      </div>
      <div style={{ display: 'flex', gap: '32px', fontSize: '13px', alignItems: 'center' }}>
        <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ver Catálogo</Link>
        <button 
          onClick={() => window.location.href = '/admin/login'} 
          style={{ 
            background: 'rgba(197, 160, 89, 0.1)', 
            border: '1px solid rgba(197, 160, 89, 0.2)', 
            color: '#a38241', 
            cursor: 'pointer',
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#c5a059';
            e.target.style.color = 'white';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(197, 160, 89, 0.1)';
            e.target.style.color = '#a38241';
          }}
        >
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}
