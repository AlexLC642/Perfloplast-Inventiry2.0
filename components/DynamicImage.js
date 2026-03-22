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
      className="lumina-fidelity-final-v7.14" 
      key={resSrc} // Force clean remount when product changes to prevent ID collisions
      style={{ 
        position: 'relative', width: '100%', height: '100%', overflow: 'hidden', 
        backgroundImage: resScene ? `url(${resScene})` : 'none', 
        backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 'inherit' 
      }}
    >
      {/* ISOLATION ENGINE SVG */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id={fidEngineId} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -1.5 -1.5 -1.5 1 3.5" />
        </filter>
      </svg>

      <div style={{ position: 'absolute', inset: 0, filter: !resMask ? `url(#${fidEngineId})` : 'none' }}>
        {/* BASE: Original high-res photo for perfect whites */}
        <img src={resSrc} alt="" style={{ ...studioStyles, zIndex: 1, filter: 'contrast(1.1) brightness(1.02)' }} />

        {/* LUMINA COLORING SYSTEM */}
        {!isNeutralColor && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
             {/* A. Neutralizer Pass */}
             <img src={resSrc} alt="" style={{ ...alphaMaskStyles, filter: 'grayscale(1) brightness(1.05) contrast(1.1)', opacity: 1, zIndex: 3 }} />
             
             {/* B. Color Hue Injection */}
             <div style={{ ...alphaMaskStyles, backgroundColor: color, mixBlendMode: 'color', opacity: 0.9, zIndex: 4 }} />
             
             {/* C. Soft-Light Volume */}
             <div style={{ ...alphaMaskStyles, backgroundColor: color, mixBlendMode: 'soft-light', opacity: 0.5, zIndex: 5 }} />

             {/* D. SPECULAR OVERRIDE (Final White-Lid Protection) */}
             <div style={{ 
                ...alphaMaskStyles, 
                backgroundImage: `url(${resSrc})`,
                backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                mixBlendMode: 'screen', 
                opacity: 0.85, 
                filter: 'grayscale(1) contrast(10) brightness(0.85)',
                zIndex: 6 
             }} />
          </div>
        )}
      </div>
    </div>
  );
}
