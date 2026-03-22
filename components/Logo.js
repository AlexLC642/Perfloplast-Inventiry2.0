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
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}
      >
        {/* The "P" Symbol - Realistic 3-Block Design */}
        {/* 1. Main Vertical Pillar (Primary Blue) */}
        <path 
          d="M18 10V90H42V10H18Z" 
          fill={color} 
        />
        {/* 2. Top Curved Segment (Darker depth) */}
        <path 
          d="M42 10V48H66C80 48 91 37 91 23.5C91 10 80 0 66 0H42V10Z" 
          fill="#002D72" 
        />
        {/* 3. Glossy Surface / Highlight Block (Subtle Teal contrast) */}
        <path 
          d="M42 10H70C74 10 77 13 77 17C77 21 74 24 70 24H42V10Z" 
          fill="white" 
          opacity="0.15"
        />
        <path 
          d="M42 12H58C62 12 65 15 65 19C65 23 62 26 58 26H42V12Z" 
          fill="white" 
          opacity="0.1"
        />
      </svg>
      
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, gap: '2px' }}>
        <span style={{ 
          fontSize: `${size * 0.58}px`, 
          fontWeight: '900', 
          color: '#006666', 
          letterSpacing: '-0.025em',
          fontFamily: 'Inter, system-ui, sans-serif',
          whiteSpace: 'nowrap',
          textTransform: 'uppercase'
        }}>
          PERFLO PLAST
        </span>
        <span style={{ 
          fontSize: `${size * 0.15}px`, 
          fontWeight: '800', 
          color: '#718096', 
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          opacity: 0.9
        }}>
          INDUSTRIA DE PLÁSTICO
        </span>
      </div>
    </div>
  );
}
