'use client';

export default function Logo({ size = 56, color = '#0047AB' }) {
  // size represents the height of the icon; total width is proportional
  return (
    <div 
      className="logo-container" 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: `${size * 0.3}px`, 
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
      >
        {/* The "P" Symbol - Dual Block Design as per Image 4 */}
        <path 
          d="M20 15V85H42V15H20Z" 
          fill={color} 
        />
        <path 
          d="M42 15V52H65C78.2548 52 89 41.2548 89 28C89 14.7452 78.2548 4 65 4H42V15Z" 
          fill="#002D72" 
          style={{ opacity: 0.95 }}
        />
      </svg>
      
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ 
          fontSize: `${size * 0.55}px`, 
          fontWeight: '900', 
          color: '#006666', 
          letterSpacing: '-0.01em',
          fontFamily: 'var(--font-display, sans-serif)',
          whiteSpace: 'nowrap'
        }}>
          PERFLO PLAST
        </span>
        <span style={{ 
          fontSize: `${size * 0.16}px`, 
          fontWeight: '700', 
          color: '#64748b', 
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginTop: '2px',
          whiteSpace: 'nowrap'
        }}>
          INDUSTRIA DE PLÁSTICO
        </span>
      </div>
    </div>
  );
}
