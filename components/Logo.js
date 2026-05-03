'use client';
import { motion } from 'framer-motion';

export default function Logo({ size = 56, color = '#0047AB', showIcon = false }) {
  // size represents the height of the icon; total width is proportional
  return (
    <div 
      className="logo-container" 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: showIcon ? `${size * 0.3}px` : '0', 
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      {showIcon && (
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
          <svg 
            width={size} 
            height={size} 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}
          >
            {/* The "P" Symbol - Realistic 3-Block Design */}
            <path d="M18 10V90H42V10H18Z" fill={color} />
            <path d="M42 10V48H66C80 48 91 37 91 23.5C91 10 80 0 66 0H42V10Z" fill="#002D72" />
            <path d="M42 10H70C74 10 77 13 77 17C77 21 74 24 70 24H42V10Z" fill="white" opacity="0.15" />
          </svg>
          {/* Premium Shine Overlay */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              transform: 'skewX(-20deg)',
              zIndex: 10
            }}
          />
        </div>
      )}
      
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
