'use client';
import { motion } from 'framer-motion';

export default function Logo({ size = 56, color = '#0047AB' }) {
  return (
    <motion.div 
      initial={{ rotate: -10, scale: 0.9 }}
      animate={{ rotate: 0, scale: 1 }}
      style={{ 
        width: size, 
        height: size, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <svg width={size} height={size * 0.8} viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Official 'P' Logo Icon (Dual-block construction) */}
          {/* Main Block (Blue) */}
          <path d="M10 40L35 15H75L85 25V45H60L50 35V80H30L25 75V40H10Z" fill={color} />
          {/* Accent Block (Darker/Different depth) */}
          <path d="M60 25V45H85L90 40V20L80 15H60L60 25Z" fill={color} opacity="0.9" />
          {/* Internal negative space */}
          <path d="M50 25H65V40H50V25Z" fill="white" />
        </svg>
        
        <div style={{ marginTop: '4px' }}>
          <div style={{ 
            fontSize: size * 0.28, 
            fontWeight: '900', 
            color: '#008B8B', 
            letterSpacing: '0.02em', 
            textTransform: 'uppercase',
            lineHeight: 1,
            fontFamily: 'var(--font-display)'
          }}>
            PERFLO PLAST
          </div>
          <div style={{ 
            fontSize: size * 0.09, 
            fontWeight: '600', 
            color: '#64748b', 
            letterSpacing: '0.3em', 
            textTransform: 'uppercase',
            marginTop: '2px',
            lineHeight: 1
          }}>
            INDUSTRIA DE PLÁSTICO
          </div>
        </div>
      </div>
    </motion.div>
  );
}
