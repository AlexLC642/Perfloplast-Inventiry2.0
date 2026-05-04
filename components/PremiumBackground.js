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
      background: '#fffaff' // Soft pinkish white base
    }}>
      {/* Animated Floating Mesh Blobs (Pink/Rose) */}
      <motion.div
        animate={{
          x: [0, 50, -50, 0],
          y: [0, -30, 30, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: '-10%',
          left: '10%',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, rgba(252, 231, 243, 0.6) 0%, rgba(252, 231, 243, 0) 70%)',
          filter: 'blur(80px)',
          borderRadius: '50%',
        }}
      />
      
      <motion.div
        animate={{
          x: [0, -40, 40, 0],
          y: [0, 60, -60, 0],
          scale: [1.1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          bottom: '0%',
          right: '-5%',
          width: '70vw',
          height: '70vw',
          background: 'radial-gradient(circle, rgba(251, 207, 232, 0.5) 0%, rgba(251, 207, 232, 0) 70%)',
          filter: 'blur(100px)',
          borderRadius: '50%',
        }}
      />

      {/* Animated Gold/Bronze Blob */}
      <motion.div
        animate={{
          x: [0, 30, -30, 0],
          y: [0, 40, -40, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: '30%',
          right: '15%',
          width: '40vw',
          height: '40vw',
          background: 'radial-gradient(circle, rgba(197, 160, 89, 0.2) 0%, rgba(197, 160, 89, 0) 70%)',
          filter: 'blur(90px)',
          borderRadius: '50%',
          zIndex: 0
        }}
      />

      {/* Primary Marble Layer with Pink Tint */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ 
          x: [0, -30, 0],
          y: [0, -15, 0],
          rotate: [0, 0.3, 0]
        }}
        transition={{ 
          duration: 45, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        style={{ 
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '120%',
          height: '120%',
          backgroundImage: 'url("/images/backgrounds/premium-marble.png")',
          backgroundSize: 'cover',
          opacity: 0.7,
          mixBlendMode: 'multiply',
          filter: 'contrast(1.05) brightness(1.02)'
        }}
      />

      {/* Subtle Grain Overlay for Texture */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.03,
        pointerEvents: 'none',
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")',
        zIndex: 1
      }} />

      {/* Soft Vignette and Final Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0%, rgba(255,241,242,0.4) 100%)',
        zIndex: 2
      }} />
    </div>
  );
}
