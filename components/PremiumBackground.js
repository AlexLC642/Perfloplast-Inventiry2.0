'use client';
import { motion } from 'framer-motion';

export default function PremiumBackground() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      overflow: 'hidden',
      background: '#ffffff'
    }}>
      <motion.div
        initial={{ scale: 1.1, x: -20 }}
        animate={{
          x: [0, -40, 0],
          y: [0, -20, 0],
          rotate: [0, 0.5, 0]
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '120%',
          height: '120%',
          background: 'url("/images/backgrounds/premium-marble.png")',
          backgroundSize: 'cover',
          opacity: 0.9
        }}
      />
      {/* Subtle overlay to improve readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)'
      }} />
    </div>
  );
}
