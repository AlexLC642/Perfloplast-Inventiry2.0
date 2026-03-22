'use client';
import { useState, useEffect, useMemo } from 'react';

// Fidelity Engine v7.14 - "Lumina Hardware Fidelity"
// Final Handover Version: Sanitized hooks and variable collision protection.
export default function DynamicImage({ src, maskSrc, color, transform = { scale: 1, x: 0, y: 0 }, sceneSrc = '' }) {
  // 1. ALL HOOKS (Strictly ordered at the top level)
  const fidEngineId = useMemo(() => `fid-${Math.random().toString(36).substr(2, 9)}`, []);
  
  const [resSrc, setResSrc] = useState(null);
  const [resMask, setResMask] = useState(null);
  const [resScene, setResScene] = useState(null);

  useEffect(() => {
    let sUrl = null, mUrl = null, scUrl = null;
    if (src) sUrl = typeof src === 'string' ? src : URL.createObjectURL(src);
    if (maskSrc) mUrl = typeof maskSrc === 'string' ? maskSrc : URL.createObjectURL(maskSrc);
    if (sceneSrc) scUrl = typeof sceneSrc === 'string' ? sceneSrc : URL.createObjectURL(sceneSrc);

    setResSrc(sUrl);
    setResMask(mUrl);
    setResScene(scUrl);

    return () => {
      if (sUrl && typeof src !== 'string') URL.revokeObjectURL(sUrl);
      if (mUrl && typeof maskSrc !== 'string') URL.revokeObjectURL(mUrl);
      if (scUrl && typeof sceneSrc !== 'string') URL.revokeObjectURL(scUrl);
    };
  }, [src, maskSrc, sceneSrc]);

  // 2. COMPUTED CONSTANTS (After all hooks)
  const isNeutralColor = !color || color.toLowerCase() === '#ffffff' || color.toLowerCase() === 'transparent';
  
  const studioStyles = {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    objectFit: 'contain', transformOrigin: 'center center',
    transform: `scale(${transform.scale}) translate(${transform.x}%, ${transform.y}%)`,
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'transform, opacity, filter',
  };

  const activeMaskUrl = resMask ? `url(${resMask})` : `url(${resSrc})`;
  const alphaMaskStyles = {
    ...studioStyles,
    maskImage: activeMaskUrl, WebkitMaskImage: activeMaskUrl,
    maskSize: 'contain', WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center', WebkitMaskPosition: 'center',
  };

  if (!resSrc) return null;

  return (
    <div 
      className="lumina-fidelity-v7.18" 
      key={resSrc} 
      style={{ 
        position: 'relative', width: '100%', height: '100%', overflow: 'hidden', 
        borderRadius: 'inherit',
        backgroundColor: '#f1f5f9' // Elegant fallback
      }}
    >
      {/* 1. PERMANENT SCENE LAYER (Marble Fallback) */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: (resScene && !resScene.includes('uploads')) ? `url(${resScene})` : "url('/images/backgrounds/marble-bg.png')",
        backgroundSize: 'cover', backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0
      }} />

      {/* 2. ISOLATION ENGINE SVG (Non-blocking but Active) */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <filter id={fidEngineId} colorInterpolationFilters="sRGB" x="-10%" y="-10%" width="120%" height="120%">
           <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -1.5 -1.5 -1.5 1 3.5" result="erased" />
           <feGaussianBlur in="erased" stdDeviation="0.5" result="soft" />
           <feComposite in="erased" in2="soft" operator="over" />
        </filter>
      </svg>

      {/* 3. PRODUCT STACK */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        {/* BASE: The filtered original photo with a subtle shadow */}
        <img 
          src={resSrc} 
          alt="" 
          style={{ 
            ...studioStyles, 
            zIndex: 1, 
            filter: !resMask ? `url(#${fidEngineId}) drop-shadow(0 10px 30px rgba(0,0,0,0.15)) contrast(1.1) brightness(1.02)` : 'drop-shadow(0 10px 30px rgba(0,0,0,0.15)) contrast(1.1) brightness(1.02)' 
          }} 
        />

        {/* LUMINA COLORING SYSTEM */}
        {!isNeutralColor && (
          <>
             {/* A. Neutralizer (Filtered) */}
             <img 
                src={resSrc} 
                alt="" 
                style={{ 
                  ...alphaMaskStyles, 
                  filter: !resMask ? `url(#${fidEngineId}) grayscale(1) brightness(1.05) contrast(1.1)` : 'grayscale(1) brightness(1.05) contrast(1.1)', 
                  opacity: 1, 
                  zIndex: 2 
                }} 
             />
             
             {/* B. Color Hue Injection */}
             <div style={{ ...alphaMaskStyles, backgroundColor: color, mixBlendMode: 'color', opacity: 0.9, zIndex: 3 }} />
             
             {/* C. Soft-Light Volume */}
             <div style={{ ...alphaMaskStyles, backgroundColor: color, mixBlendMode: 'soft-light', opacity: 0.45, zIndex: 4 }} />

             {/* D. SPECULAR OVERRIDE (Protecting Whites) */}
             <div style={{ 
                ...alphaMaskStyles, 
                backgroundImage: `url(${resSrc})`,
                backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                mixBlendMode: 'screen', 
                opacity: 0.7, 
                filter: 'grayscale(1) contrast(3) brightness(1.0)', // Even more natural specular recovery
                zIndex: 5 
             }} />
          </>
        )}
      </div>
    </div>
  );
}
