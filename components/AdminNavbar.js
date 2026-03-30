'use client';
import Link from 'next/link';

export default function AdminNavbar() {
  return (
    <nav style={{ 
      padding: '16px 20px', 
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(197, 160, 89, 0.15)', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 25px rgba(0,0,0,0.05)',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      <div style={{ 
        fontFamily: 'var(--font-display)',
        fontSize: '12px', 
        fontWeight: '900', 
        letterSpacing: '0.12em', 
        color: '#1a1a1b',
        whiteSpace: 'nowrap'
      }}>
        PERFLO-PLAST <span style={{ color: '#c5a059' }}>ADMIN</span>
      </div>
      <div style={{ display: 'flex', gap: '16px', fontSize: '11px', alignItems: 'center' }}>
        <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ver Catálogo</Link>
        <button 
          onClick={() => window.location.href = '/admin/login'} 
          style={{ 
            background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.1) 0%, rgba(197, 160, 89, 0.2) 100%)', 
            border: '1px solid rgba(197, 160, 89, 0.25)', 
            color: '#8e6d2c', 
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '10px',
            fontWeight: '900',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 8px rgba(197, 160, 89, 0.1)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#c5a059';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(197, 160, 89, 0.1) 0%, rgba(197, 160, 89, 0.2) 100%)';
            e.currentTarget.style.color = '#8e6d2c';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Salir
        </button>
      </div>
    </nav>
  );
}
