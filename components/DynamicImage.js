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
      className="lumina-fidelity-v7.19" 
      key={resSrc} 
      style={{ 
        position: 'relative', width: '100%', height: '100%', overflow: 'hidden', 
        borderRadius: 'inherit',
        background: "#f1f5f9 url('/images/backgrounds/marble-bg.png') center/cover no-repeat" 
      }}
    >
      {/* 1. OPTIONAL SCENE OVERRIDE */}
      {(resScene && !resScene.includes('uploads')) && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${resScene})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          zIndex: 1
        }} />
      )}

      {/* 2. ISOLATION ENGINE SVG (Active but hidden) */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '1px', opacity: 0.1, pointerEvents: 'none', zIndex: -1 }}>
        <filter id={fidEngineId} colorInterpolationFilters="sRGB">
           <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -1.5 -1.5 -1.5 1 3.5" result="erased" />
           <feGaussianBlur in="erased" stdDeviation="0.4" result="soft" />
           <feComposite in="erased" in2="soft" operator="over" />
        </filter>
      </svg>

      {/* 3. PRODUCT STACK */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {/* BASE: The filtered original photo with a subtle shadow */}
        <img 
          src={resSrc} 
          alt="" 
          style={{ 
            ...studioStyles, 
            zIndex: 1, 
            filter: !resMask ? `url(#${fidEngineId}) drop-shadow(0 15px 40px rgba(0,0,0,0.2))` : 'drop-shadow(0 15px 40px rgba(0,0,0,0.2))' 
          }} 
        />

        {/* LUMINA COLORING SYSTEM */}
        {!isNeutralColor && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
             {/* A. Neutralizer (Filtered) */}
             <img 
                src={resSrc} 
                alt="" 
                style={{ 
                  ...alphaMaskStyles, 
                  filter: !resMask ? `url(#${fidEngineId}) grayscale(1) brightness(1.05) contrast(1.15)` : 'grayscale(1) brightness(1.05) contrast(1.15)', 
                  opacity: 1, 
                  zIndex: 3 
                }} 
             />
             
             {/* B. Color Hue Injection */}
             <div style={{ ...alphaMaskStyles, backgroundColor: color, mixBlendMode: 'color', opacity: 0.95, zIndex: 4 }} />
             
             {/* C. Soft-Light Volume */}
             <div style={{ ...alphaMaskStyles, backgroundColor: color, mixBlendMode: 'soft-light', opacity: 0.5, zIndex: 5 }} />

             {/* D. SPECULAR OVERRIDE (Protecting Whites) */}
             <div style={{ 
                ...alphaMaskStyles, 
                backgroundImage: `url(${resSrc})`,
                backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                mixBlendMode: 'screen', 
                opacity: 0.8, 
                filter: 'grayscale(1) contrast(5) brightness(0.95)', 
                zIndex: 6 
             }} />
          </div>
        )}
      </div>
    </div>
  );
}
