'use client';

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
      backgroundColor: '#f8fafc'
    }}>
      {/* High-Resolution Static Background Layer */}
      <div 
        style={{ 
          position: 'absolute',
          top: '-2%',
          left: '-2%',
          width: '104%',
          height: '104%',
          backgroundImage: 'url("/images/backgrounds/premium-deep-gold.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 1,
        }}
      />

      {/* Subtle Overlay to improve legibility and depth */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
        zIndex: 1
      }} />

      {/* Very faint shimmer effect (Optional, but static as requested) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(45deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
        zIndex: 2,
        pointerEvents: 'none'
      }} />
    </div>
  );
}
