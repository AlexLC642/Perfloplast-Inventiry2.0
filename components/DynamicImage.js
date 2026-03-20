'use client';
import { useState, useEffect } from 'react';

// Studio Staging Engine v6.0 - "The Professional Realism Standard"
// Optimized for: Global Scene Compositing & High-Fidelity Coloration.
export default function DynamicImage({ src, maskSrc, color, transform = { scale: 1, x: 0, y: 0 }, sceneSrc = '' }) {
  const [resolvedSrc, setResolvedSrc] = useState(null);
  const [resolvedMask, setResolvedMask] = useState(null);

  useEffect(() => {
    const createSafeUrl = (s) => {
      if (!s) return null;
      if (typeof s === 'string') return s;
      try { return URL.createObjectURL(s); } catch (e) { return null; }
    };
    const ns = createSafeUrl(src);
    const nm = createSafeUrl(maskSrc);
    setResolvedSrc(ns);
    setResolvedMask(nm);
    return () => {
      if (src && typeof src !== 'string' && ns) URL.revokeObjectURL(ns);
      if (maskSrc && typeof maskSrc !== 'string' && nm) URL.revokeObjectURL(nm);
    };
  }, [src, maskSrc]);

  if (!resolvedSrc) return null;

  // ---------------------------------------------------------
  // COLORING ENGINE (v6.1 - "Masked Layer Architecture")
  // ---------------------------------------------------------
  
  const commonStyles = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    transformOrigin: 'center center',
    transform: `scale(${transform.scale}) translate(${transform.x}%, ${transform.y}%)`,
  };

  // The mask is calculated once and applied to a container
  const maskUrl = resolvedMask ? `url(${resolvedMask})` : `url(${resolvedSrc})`;
  const containerMaskStyles = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    maskImage: maskUrl,
    WebkitMaskImage: maskUrl,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
    zIndex: 10, // Must be above the base original image
    pointerEvents: 'none',
    transformOrigin: 'center center',
    transform: `scale(${transform.scale}) translate(${transform.x}%, ${transform.y}%)`,
    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const isDefaultColor = !color || color.toLowerCase() === '#ffffff' || color.toLowerCase() === 'transparent';

  return (
    <div className="studio-staging-v61" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'transparent' }}>
      
      {/* 0. GLOBAL SCENE BACKGROUND */}
      {sceneSrc && (
        <img src={sceneSrc} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      )}

      {/* 1. ORIGINAL BASE IMAGE (Preserves the core photo details) */}
      <img 
        src={resolvedSrc} 
        alt="" 
        style={{ 
          ...commonStyles, 
          zIndex: 1, 
          filter: 'contrast(1.02) saturate(0.98)' 
        }} 
      />

      {/* 2. DYNAMIC COLORING STACK (Only active if a color is selected) */}
      {!isDefaultColor && (
        <div style={containerMaskStyles}>
          {/* A. Neutralization pass (strips original color but keeps light/shadow) */}
          <img 
            src={resolvedSrc} 
            alt="" 
            style={{ 
              width: '100%', height: '100%', objectFit: 'contain',
              filter: 'grayscale(1) brightness(1.2) contrast(0.85)', 
              opacity: 1
            }} 
          />

          {/* B. Main Hue Pass (The actual chosen color) */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            backgroundColor: color, 
            mixBlendMode: 'color', 
            opacity: 0.9,
            zIndex: 11
          }} />

          {/* C. Soft-Light Polish (Adds dimension and satin finish) */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            backgroundColor: color, 
            mixBlendMode: 'soft-light', 
            opacity: 0.7,
            zIndex: 12
          }} />

          {/* D. Multiply Depth (Adds realism to crevices and shadows) */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            backgroundColor: color, 
            mixBlendMode: 'multiply', 
            opacity: 0.15,
            zIndex: 13
          }} />
          
          {/* E. Specular Reflection Recovery (Brings back the "shine") */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            backgroundImage: `url(${resolvedSrc})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            mixBlendMode: 'screen', 
            opacity: 0.35,
            filter: 'grayscale(1) contrast(5) brightness(0.6)',
            zIndex: 14
          }} />
        </div>
      )}
    </div>
  );
}
